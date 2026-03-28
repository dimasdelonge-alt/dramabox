import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import { DramaBoxScraper } from "@/lib/dramabox-scraper";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");

    const data = await DramaBoxScraper.getClassify(page); // Use specialized classify for DubIndo
    return encryptedResponse(data);
  } catch (error) {
    console.error("DramaBox DubIndo Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

