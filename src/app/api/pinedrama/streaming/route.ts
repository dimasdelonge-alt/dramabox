import { NextResponse } from "next/server";
import { PineDramaScraper } from "@/lib/pinedrama-scraper";

/**
 * Pinedrama Streaming API
 * TikTok often returns application/x-protobuf for these requests.
 * Since we don't have the Protobuf definitions, we use a binary regex fallback
 * to extract the authenticated MP4 URLs directly from the raw stream.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("book_id");
  const videoId = searchParams.get("chapter_id"); // video_id
  const seqId = parseInt(searchParams.get("seq_id") || "0");

  if (!bookId || !videoId) {
    return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
  }

  try {
    const scraper = new PineDramaScraper();
    let searchData = "";
    let methodUsed = "";

    // OPTIMIZATION: Try targeted retrieval FIRST (High Performance)
    console.log(`[PineDrama] Attempting targeted retrieval for Video: ${videoId}`);
    try {
      const targetedResponse = await scraper.getMultiAwemeDetail(videoId);
      if (targetedResponse.ok) {
        const targetedBuffer = await targetedResponse.arrayBuffer();
        let targetedRaw = Buffer.from(targetedBuffer).toString('latin1');

        // Normalize escaped slashes for regex
        if (targetedRaw.includes('\\/')) {
          targetedRaw = targetedRaw.replace(/\\\//g, '/');
        }

        searchData = targetedRaw;
        methodUsed = "targeted_multi_aweme_detail";
        console.log(`[PineDrama] Targeted retrieval successful (Size: ${searchData.length})`);
      }
    } catch (targetedError) {
      console.warn(`[PineDrama] Targeted retrieval failed, falling back to batch...`, targetedError);
    }

    // PRIMARY: Use query_type=seq_id for precise episode targeting
    // This bypasses TikTok's last_watch lock which always returns the last viewed episode
    if (!searchData || searchData.length < 500) {
      console.log(`[PineDrama] Using SEQ_ID targeting for Video: ${videoId} (Seq: ${seqId})`);

      const url = scraper.buildUrl("/tiktok/md/collection/video/v1/", {
        collection_id: bookId,
        video_id: "0",
        count: "1",
        current_seq_id: String(seqId),
        direction: "0",
        enter_from: "series_discover",
        request_source: "innerfeed",
        root_scene: "2",
        is_trailer_paginated: "false",
        need_collection_detail: "false",
        query_type: "seq_id",
        query_scene: "mini_drama_container"
      });

      const response = await fetch(url, {
        headers: scraper.getRequestHeaders(),
        cache: 'no-store'
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const rawData = Buffer.from(buffer).toString('latin1');

        if (!rawData.includes("Parameter tidak valid") && !rawData.includes("Server sedang tidak tersedia")) {
          let videoIdIndex = rawData.indexOf(videoId);
          if (videoIdIndex === -1) videoIdIndex = rawData.indexOf('"' + videoId + '"');

          if (videoIdIndex !== -1) {
            const start = Math.max(0, videoIdIndex - 500);
            searchData = rawData.substring(start, start + 15000);
            methodUsed = "seq_id_surgical";
            console.log(`[PineDrama] SEQ_ID hit! Found ${videoId} at index ${videoIdIndex}.`);
          } else if (rawData.length > 1000) {
            // Video ID not as text but response has data - full scan
            searchData = rawData;
            methodUsed = "seq_id_full_scan";
            console.log(`[PineDrama] SEQ_ID response OK but video_id not found, full scan (${rawData.length}).`);
          }
        }
      }
    }

    // FALLBACK: Use last_watch if seq_id didn't work
    if (!searchData || searchData.length < 500) {
      console.log(`[PineDrama] SEQ_ID failed, trying LAST_WATCH fallback...`);

      const url = scraper.buildUrl("/tiktok/md/collection/video/v1/", {
        collection_id: bookId,
        video_id: videoId,
        count: "100",
        current_seq_id: "0",
        direction: "1",
        enter_from: "paid_series_detail_page",
        request_source: "innerfeed",
        root_scene: "2",
        is_preload: "0",
        is_trailer_paginated: "false",
        need_collection_detail: "true",
        query_type: "last_watch",
        query_scene: "mini_drama_container"
      });

      const response = await fetch(url, {
        headers: scraper.getRequestHeaders(),
        cache: 'no-store'
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const rawData = Buffer.from(buffer).toString('latin1');

        if (!rawData.includes("Server sedang tidak tersedia") && !rawData.includes("Parameter tidak valid")) {
          let videoIdIndex = rawData.indexOf(videoId);
          if (videoIdIndex === -1) videoIdIndex = rawData.indexOf('"' + videoId + '"');

          if (videoIdIndex !== -1) {
            const start = Math.max(0, videoIdIndex - 500);
            searchData = rawData.substring(start, start + 15000);
            methodUsed = "last_watch_surgical";
            console.log(`[PineDrama] LAST_WATCH hit! Found ${videoId} at index ${videoIdIndex}.`);
          } else if (rawData.length > 1000) {
            searchData = rawData;
            methodUsed = "last_watch_full_scan";
            console.log(`[PineDrama] LAST_WATCH full scan (${rawData.length}).`);
          }
        }
      }
    }

    // TikTok CDN URL Regex
    const regex = /https?:\/\/[a-zA-Z0-9.-]+\.(?:tiktokcdn|tiktokv)\.com\/[^\s"'>\\\u0000-\u001F]+/g;
    const allMatches = searchData.match(regex) || [];

    if (allMatches.length > 0) {
      const matches: string[] = [];
      allMatches.forEach(match => {
        const parts = match.split(/(?=https?:\/\/)/);
        parts.forEach(p => {
          const cleanPart = p.split(/[^\x20-\x7E]/)[0]; // Keep only printable ASCII
          if (cleanPart.length > 20) matches.push(cleanPart);
        });
      });

      // Filter out non-video URLs (avatars, thumbnails, audio)
      const videoMatches = matches.filter(url =>
        !url.includes('tplv-') &&          // Thumbnail processors
        !url.includes('avt-') &&            // Avatars
        !url.includes('.mp3') &&            // Audio files
        !url.includes('musically-maliva') && // Profile assets
        (url.includes('/video/') || url.includes('video_mp4') || url.includes('.mp4') || url.includes('v31') || url.includes('v3.'))
      );

      // Use video-specific matches if available, otherwise fall back to all
      const candidateUrls = videoMatches.length > 0 ? videoMatches : matches;

      // Priority sort: Prefer v31/v3 and tiktokcdn.com
      const bestMatch = candidateUrls.find(url => url.includes("v31") && url.includes("tiktokcdn.com")) ||
        candidateUrls.find(url => url.includes("v3") && url.includes("tiktokcdn.com")) ||
        candidateUrls.find(url => url.includes("/video/") && url.includes("tiktokcdn.com")) ||
        candidateUrls.find(url => url.includes("tiktokcdn.com")) ||
        candidateUrls.find(url => url.includes("video_mp4")) ||
        candidateUrls[0];

      const cleanUrl = bestMatch.replace(/[^\x20-\x7E]+$/, "").split(/[\\"'>\s]/)[0];

      console.log(`[PineDrama] Found ${candidateUrls.length} video links via ${methodUsed}.`);
      console.log(`[PineDrama] SELECTED URL: ${cleanUrl}`);

      return NextResponse.json({
        success: true,
        data: {
          url: cleanUrl,
          type: "mp4",
          method: methodUsed
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: "Gagal mengekstrak link video dari TikTok (All methods failed)."
    }, { status: 500 });

  } catch (error: any) {
    console.error("PineDrama Streaming Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
