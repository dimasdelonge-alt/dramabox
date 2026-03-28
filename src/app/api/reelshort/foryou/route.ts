import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { ReelShortScraper } from "@/lib/reelshort-scraper";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20;

    // 1. Fetch homepage data directly using our web scraper
    const allBooks = await ReelShortScraper.getHomepage();

    if (allBooks && allBooks.length > 0) {
      // 2. Paginate the array of books (Skip the first 16 already shown in shelves)
      const skipCount = 16;
      const startIndex = ((page - 1) * pageSize) + skipCount;
      const paginatedBooks = allBooks.slice(startIndex, startIndex + pageSize);

      // 3. Map to Standard SekaiDrama Format
      const mappedData = paginatedBooks.map((item: any) => ({
        bookId: item.book_id,
        bookName: item.book_title,
        coverWap: item.book_pic, // Map book_pic to coverWap
        cover: item.book_pic,    // Also map to cover for fallback
        chapterCount: item.chapter_count || 0,
        introduction: item.special_desc || item.tag || "",
        corner: item.start_play_episode ? { name: "Dubbing", color: "#FF4D4F" } : undefined
      }));

      return encryptedResponse(mappedData);
    }

    // Fallback if scraper fails
    return encryptedResponse([]);
  } catch (error) {
    console.error("ReelShort ForYou API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
