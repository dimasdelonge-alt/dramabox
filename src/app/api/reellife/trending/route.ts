import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const REELLIFE_API = process.env.REELLIFE_API_URL || "http://localhost:8000/api/reellife";

export async function GET() {
    try {
        const response = await fetch(`${REELLIFE_API}/trending`, { cache: 'no-store' });
        if (!response.ok) return NextResponse.json({ error: "Failed" }, { status: response.status });
        const data = await safeJson(response);
        return encryptedResponse(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
