import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const REELLIFE_API = process.env.REELLIFE_API_URL || "http://localhost:8000/api/reellife";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get("page") || "1";

        const response = await fetch(`${REELLIFE_API}/foryou?page=${page}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch" }, { status: response.status });
        }

        const data = await safeJson(response);
        return encryptedResponse(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
