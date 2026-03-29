import { NextResponse } from "next/server";
import { PineDramaScraper } from "@/lib/pinedrama-scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || "";
  const count = parseInt(searchParams.get("count") || "15");

  try {
    const scraper = new PineDramaScraper();
    const data = await scraper.getHome(cursor, count);
    
    // Map TikTok collections to our standard Drama format
    const dramas = data.collections?.map((col: any) => ({
      bookId: col.collection_id,
      bookName: col.title,
      cover: col.cover?.url_list?.[0],
      introduction: col.categories || "",
      tagNames: col.theme_tag_list?.map((t: any) => t.name) || [],
      num_videos: col.num_videos,
      num_watched: col.num_watched,
      is_limited_free: col.is_limited_free
    })) || [];

    return NextResponse.json({
      success: true,
      data: dramas,
      has_more: data.has_more || false,
      next_cursor: data.has_more ? data.cursor : null
    });
  } catch (error: any) {
    console.error("PineDrama Homepage Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
