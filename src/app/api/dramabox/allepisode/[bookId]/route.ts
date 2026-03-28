import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import { DramaBoxScraper } from "@/lib/dramabox-scraper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  try {
    const data = await DramaBoxScraper.getEpisodes(bookId);
    return encryptedResponse(data);
  } catch (error) {
    console.error("DramaBox AllEpisode Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
