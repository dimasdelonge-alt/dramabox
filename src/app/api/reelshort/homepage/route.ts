import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { ReelShortScraper } from "@/lib/reelshort-scraper";
import { NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/reelshort";

export async function GET() {
  try {
    // 1. Try Direct Scraper
    const { books, shelves } = await ReelShortScraper.getHomepageData();
    
    if (books && books.length > 0) {
      console.log(`[ReelShort API] Success! Scraped ${books.length} books and ${shelves.length} shelves locally.`);
      
      return encryptedResponse({
        success: true,
        data: {
          tab_list: [{ tab_id: 1, tab_name: "POPULER" }],
          lists: shelves.map((shelf, sIdx) => ({
            tab_id: 1,
            title: shelf.title,
            books: shelf.books,
            banners: sIdx === 0 ? shelf.books.slice(0, 5).map((b: any) => ({
              pic: b.book_pic,
              jump_param: {
                book_id: b.book_id,
                book_title: b.book_title
              },
              play_button: 1
            })) : []
          }))
        },
        status: "direct"
      });
    }

    // 2. Fallback to Upstream
    const response = await fetch(`${UPSTREAM_API}/homepage`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const data = await safeJson(response);
    return encryptedResponse(data);
  } catch (error) {
    console.error("ReelShort API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

