import { NextResponse } from "next/server";
import { PineDramaScraper } from "@/lib/pinedrama-scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("book_id");

  if (!bookId) {
    return NextResponse.json({ success: false, message: "Missing book_id" }, { status: 400 });
  }

  try {
    const scraper = new PineDramaScraper();

    // Fetch episodes and collection metadata in parallel
    const [episodeResult, homeResult] = await Promise.all([
      (async () => {
        let allEpisodes: any[] = [];
        let cursor = "0";
        let hasMore = true;
        let iterations = 0;
        let lastData: any = null;

        while (hasMore && iterations < 6) {
          const data = await scraper.getEpisodes(bookId, cursor);
          const pageEpisodes = data.episode_list || [];
          lastData = data;
          allEpisodes = [...allEpisodes, ...pageEpisodes];
          hasMore = data.has_more;
          cursor = data.cursor;
          iterations++;
          if (!hasMore) break;
        }

        return { episodes: allEpisodes, creatorId: lastData?.creator_uid || "unknown" };
      })(),
      // Fetch homepage to get collection metadata (title, cover, categories)
      (async () => {
        try {
          const homeData = await scraper.getHome("", 50);
          const collection = homeData.collections?.find(
            (c: any) => c.collection_id === bookId
          );
          return collection || null;
        } catch {
          return null;
        }
      })()
    ]);

    const { episodes: allEpisodes, creatorId } = episodeResult;
    console.log(`[PineDrama] Book: ${bookId} | Creator: ${creatorId} | Ep Count: ${allEpisodes.length}`);

    // Map TikTok response to our standard format
    const mappedEpisodes = allEpisodes
      .filter((ep: any) => {
        return ep.video_id && ep.num > 0 && ep.is_intro === false;
      })
      .map((ep: any) => ({
        serial_number: ep.num,
        chapter_id: ep.video_id,
        chapter_title: `Episode ${ep.num}`,
        is_free: !ep.is_paid || ep.is_limited_free,
        has_purchased: ep.has_purchased,
        seq_id: ep.seq_id
      }));

    // Deduplicate and sort
    const uniqueEpisodes = Array.from(new Map(mappedEpisodes.map(ep => [ep.serial_number, ep])).values());
    uniqueEpisodes.sort((a, b) => a.serial_number - b.serial_number);

    return NextResponse.json({
      success: true,
      data: {
        bookId,
        title: homeResult?.title || "PineDrama Series",
        cover: homeResult?.cover?.url_list?.[0] || "",
        description: homeResult?.categories || "",
        tags: [],
        totalEpisodes: uniqueEpisodes.length,
        episodes: uniqueEpisodes
      }
    });
  } catch (error: any) {
    console.error("PineDrama Detail Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
