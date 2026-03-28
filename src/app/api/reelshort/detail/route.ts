import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { ReelShortScraper } from "@/lib/reelshort-scraper";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/reelshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return encryptedResponse(
        { error: "bookId is required" },
        400
      );
    }

    // 1. Try Direct Scraper (cache-based)
    console.log(`[ReelShort API] Resolving detail for bookId: ${bookId}`);
    const scrapedDetail = await ReelShortScraper.getDramaDetail(bookId);
    
    if (scrapedDetail) {
      console.log(`[ReelShort API] Found book in cache: ${scrapedDetail.book_title}`);
      // Normalize to match frontend's ReelShortDetailData interface
      const normalizedDetail = {
        success: true,
        bookId: scrapedDetail.book_id,
        title: scrapedDetail.book_title,
        cover: scrapedDetail.book_pic,
        description: scrapedDetail.special_desc || "",
        totalEpisodes: scrapedDetail.chapter_count,
        tag: scrapedDetail.theme,
        episodes: (scrapedDetail.chapter_base || []).map((ch: any, idx: number) => ({
          episode_num: ch.serial_number || idx + 1,
          title: ch.chapter_name,
          chapter_id: ch.chapter_id,
        })),
        status: "direct"
      };
      return encryptedResponse(normalizedDetail);
    }

    console.log(`[ReelShort API] Book not in cache, falling back to upstream.`);

    // 2. Fallback to Upstream
    const response = await fetch(
      `${UPSTREAM_API}/detail?bookId=${encodeURIComponent(bookId)}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return encryptedResponse(
        { error: "Failed to fetch detail" },
        response.status
      );
    }

    const data = await safeJson(response);
    return encryptedResponse(data);
  } catch (error) {
    console.error("ReelShort Detail Error:", error);
    return encryptedResponse(
      { error: "Internal Server Error" },
      500
    );
  }
}

