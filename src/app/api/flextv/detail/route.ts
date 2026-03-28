
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get("book_id");
        
        if (!seriesId) {
            return NextResponse.json({ error: "Missing book_id" }, { status: 400 });
        }

        const res = await FlexTVScraper.getDramaDetail(seriesId);
        
        if (res && res.code === 0 && res.data) {
            const detail = res.data.detail || {};
            const list = res.data.list || [];
            
            // Map to SekaiDrama Detail format
            const bookDetail = {
                book_id: detail.series_id,
                book_title: detail.series_name,
                book_pic: detail.vertical_cover_url || detail.horizontal_cover_url,
                description: detail.introduction,
                chapter_count: detail.max_series_no,
                tag: detail.tag_names?.join(", "),
                chapter_base: list.map((ep: any) => ({
                    chapter_id: ep.series_no.toString(),
                    serial_number: ep.series_no,
                    chapter_title: `Episode ${ep.series_no}`,
                    is_charge: ep.is_charge
                }))
            };

            return encryptedResponse({
                success: true,
                data: bookDetail
            });
        }

        return NextResponse.json({ error: "Drama not found" }, { status: 404 });
    } catch (error) {
        console.error("[FlexTV API] Detail Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
