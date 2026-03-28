
import { NextRequest } from "next/server";
import https from "https";
import http from "http";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const agent = new https.Agent({ rejectUnauthorized: false });

function fetchBuffer(url: string, redirectCount = 5): Promise<{ buffer: Buffer; finalUrl: string; contentType: string }> {
    return new Promise((resolve, reject) => {
        if (redirectCount <= 0) return reject(new Error("Too many redirects"));
        const isHttp = url.startsWith("http:");
        const mod = isHttp ? http : https;
        
        const req = mod.request(url, {
            method: 'GET',
            agent: isHttp ? undefined : agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Origin': 'https://www.flextv.cc',
                'Referer': 'https://www.flextv.cc/',
                'Accept': '*/*',
            },
            timeout: 30000,
        }, (res) => {
            if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                const newUrl = new URL(res.headers.location, url).href;
                res.resume();
                return resolve(fetchBuffer(newUrl, redirectCount - 1));
            }
            if ((res.statusCode || 500) >= 400) {
                res.resume();
                return reject(new Error(`Upstream ${res.statusCode}`));
            }
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => resolve({ 
                buffer: Buffer.concat(chunks), 
                finalUrl: url,
                contentType: res.headers['content-type'] || 'application/octet-stream'
            }));
            res.on('error', reject);
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
        req.end();
    });
}

export async function GET(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");

    if (!urlParam) {
        return new Response("Missing url parameter", { status: 400 });
    }

    try {
        const { buffer, finalUrl, contentType } = await fetchBuffer(urlParam);
        
        const isM3u8 = urlParam.includes('.m3u8') || buffer.slice(0, 7).toString().includes('#EXTM3U');

        if (isM3u8) {
            const text = buffer.toString('utf8');
            const baseUrl = new URL(finalUrl);
            const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
            const proto = req.headers.get("x-forwarded-proto") || "http";
            const origin = `${proto}://${host}`;

            const rewritten = text.split(/\r?\n/).map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                
                if (trimmed.startsWith('#')) {
                    // Rewrite URI="" attributes in #EXT tags (e.g. #EXT-X-KEY)
                    return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
                        try {
                            const abs = new URL(uri, baseUrl.href).href;
                            return `URI="${origin}/api/flextv/hls?url=${encodeURIComponent(abs)}"`;
                        } catch { return _m; }
                    });
                }
                
                // Segment URL line
                try {
                    const abs = new URL(trimmed, baseUrl.href).href;
                    return `${origin}/api/flextv/hls?url=${encodeURIComponent(abs)}`;
                } catch { return line; }
            }).join('\n');

            return new Response(rewritten, {
                status: 200,
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-store",
                },
            });
        }

        // Return direct binary (for keys and segments)
        return new Response(new Uint8Array(buffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(buffer.length),
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600",
            },
        });

    } catch (error) {
        console.error("[FLEXTV HLS Proxy Error]", error);
        return new Response(`Proxy error: ${error}`, { status: 502 });
    }
}
