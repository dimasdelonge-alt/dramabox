import { encryptedResponse } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { DramaBoxScraper } from "@/lib/dramabox-scraper";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await DramaBoxScraper.getLatest();
    return encryptedResponse(data);
  } catch (error) {
    console.error("DramaBox Latest Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

