import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { ReelShortScraper } from "@/lib/reelshort-scraper";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/reelshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get("bookId");
    const episodeNumberStr = searchParams.get("episodeNumber");

    if (!bookId || !episodeNumberStr) {
      return encryptedResponse(
        { error: "bookId and episodeNumber are required" },
        400
      );
    }

    const episodeNumber = parseInt(episodeNumberStr, 10);

    // 1. Try Direct Scraper (Bypasses Paywall/Upstream)
    const scrapedData = await ReelShortScraper.getEpisodeStream(bookId, episodeNumber);
    if (scrapedData && scrapedData.videoList) {
      return encryptedResponse({
        ...scrapedData,
        status: "direct"
      });
    }

    // 2. Fallback to Upstream API
    const response = await fetch(
      `${UPSTREAM_API}/episode?bookId=${encodeURIComponent(bookId)}&episodeNumber=${encodeURIComponent(episodeNumberStr)}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return encryptedResponse(
        { error: "Failed to fetch episode" },
        response.status
      );
    }

    const data = await safeJson(response);
    return encryptedResponse(data);
  } catch (error) {
    console.error("ReelShort Episode Error:", error);
    return encryptedResponse(
      { error: "Internal Server Error" },
      500
    );
  }
}

