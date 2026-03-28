import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { ReelShortScraper } from "@/lib/reelshort-scraper";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/reelshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";

    if (!query) {
      return encryptedResponse({ success: true, data: [] });
    }

    // 1. Try Direct Scraper
    const scrapedResults = await ReelShortScraper.search(query);
    if (scrapedResults && scrapedResults.length > 0) {
      const normalizedResults = scrapedResults.map((item: any) => ({
        book_id: item.book_id,
        book_title: item.book_title,
        book_pic: item.book_pic,
        special_desc: item.desc,
        chapter_count: item.chapter_count,
        theme: item.tag,
        status: "direct"
      }));
      return encryptedResponse({ success: true, data: normalizedResults });
    }

    // 2. Fallback to Upstream API
    const response = await fetch(
      `${UPSTREAM_API}/search?query=${encodeURIComponent(query)}&page=${page}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return encryptedResponse({ success: false, data: [] });
    }

    const data = await safeJson<any>(response);
    const results = data.results || [];

    const normalizedResults = results.map((item: any) => ({
      book_id: item.bookId,
      book_title: item.title,
      book_pic: item.cover,
      special_desc: item.description,
      chapter_count: item.chapterCount,
      theme: item.tag,
    }));

    return encryptedResponse({ success: true, data: normalizedResults });
  } catch (error) {
    console.error("ReelShort Search Error:", error);
    return encryptedResponse({ success: false, data: [] });
  }
}

