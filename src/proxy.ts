import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

// ── Rate limiting ───────────────────────────────────────────────
const rateLimit = new Map<string, { count: number; startTime: number }>();

// ── Auth verification ───────────────────────────────────────────
function verifyToken(token: string): boolean {
  try {
    const secret = process.env.AUTH_SECRET || "default-secret-change-me";
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const payloadB64 = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);

    const payloadStr = Buffer.from(payloadB64, "base64").toString("utf8");
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && payload.exp < Date.now()) {
      return false;
    }

    // Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadStr)
      .digest("hex");

    return signature === expectedSig;
  } catch {
    return false;
  }
}

// ── Main proxy handler ──────────────────────────────────────────
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip auth check for whitelisted paths ──
  const isAuthRoute = pathname.startsWith('/api/auth');
  const isLoginPage = pathname === '/login';
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|mp4|webm|css|js)$/i.test(pathname);
  const isNextInternal = pathname.startsWith('/_next');

  if (!isAuthRoute && !isLoginPage && !isStaticAsset && !isNextInternal) {
    // Check auth token
    const token = request.cookies.get("auth-token")?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If on login page and already authenticated, redirect to home
  if (isLoginPage) {
    const token = request.cookies.get("auth-token")?.value;
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── Rate limiting for API routes ──
  if (pathname.startsWith('/api')) {
    let ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
    if (ip === '::1') ip = '127.0.0.1';

    const limit = 150;
    const windowMs = 60 * 1000;

    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 0, startTime: Date.now() });
    }

    const data = rateLimit.get(ip)!;

    if (Date.now() - data.startTime > windowMs) {
      data.count = 0;
      data.startTime = Date.now();
    }

    data.count++;

    if (data.count > limit) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Too Many Requests',
          error: "Terlalu banyak permintaan. Mohon tunggu sebentar."
        }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon\\.ico).*)',
}
