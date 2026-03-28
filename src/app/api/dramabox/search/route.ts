import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import { DramaBoxScraper } from "@/lib/dramabox-scraper";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return encryptedResponse([]);
  }

  try {
    const data = await DramaBoxScraper.search(query);
    return encryptedResponse(data);
  } catch (error) {
    console.error("DramaBox Search Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

