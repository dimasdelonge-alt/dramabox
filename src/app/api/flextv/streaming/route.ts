
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get("book_id");
        const chapterId = searchParams.get("chapter_id");
        const serialNumber = searchParams.get("serial_number");
        
        if (!bookId || (!chapterId && !serialNumber)) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const episodeNo = serialNumber ? parseInt(serialNumber) : parseInt(chapterId as string);
        const streamData = await FlexTVScraper.getEpisodeStream(bookId, episodeNo);
        
        if (streamData) {
            return encryptedResponse(streamData);
        }

        return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    } catch (error) {
        console.error("[FlexTV API] Streaming Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
