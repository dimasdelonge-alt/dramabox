import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "Username dan password harus diisi" },
                { status: 400 }
            );
        }

        // Parse AUTH_USERS from env: format "user1:pass1,user2:pass2"
        const authUsers = process.env.AUTH_USERS || "";
        const users = authUsers.split(",").map((pair) => {
            const [u, ...pParts] = pair.trim().split(":");
            return { username: u, password: pParts.join(":") };
        });

        const matched = users.find(
            (u) => u.username === username && u.password === password
        );

        if (!matched) {
            return NextResponse.json(
                { success: false, error: "Username atau password salah" },
                { status: 401 }
            );
        }

        // Create a signed token (HMAC-SHA256)
        const secret = process.env.AUTH_SECRET || "default-secret-change-me";
        const payload = JSON.stringify({
            username: matched.username,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        const signature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
        const token = Buffer.from(payload).toString("base64") + "." + signature;

        // Set cookie
        const response = NextResponse.json({ success: true, username: matched.username });
        response.cookies.set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, error: "Terjadi kesalahan server" },
            { status: 500 }
        );
    }
}
