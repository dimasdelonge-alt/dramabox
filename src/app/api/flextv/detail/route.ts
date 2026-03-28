
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
            const detail = res.data.detail || res.data.series_detail || {};
            const list = res.data.section_list || res.data.list || res.data.series_list || [];
            
            console.log(`[FlexTV Debug] Detail for ${seriesId}: list_len=${Array.isArray(list) ? list.length : 'NOT_ARRAY'}`);

            // Map to SekaiDrama Detail format
            const chapterBase = (Array.isArray(list) ? list : []).map((ep: any) => ({
                chapter_id: (ep.id || ep.series_no || ep.id_section)?.toString(),
                serial_number: ep.id || ep.series_no || ep.id_section,
                chapter_title: `Episode ${ep.series_no || ep.id || ep.id_section}`,
                is_charge: ep.is_charge || false
            }));

            const bookDetail = {
                book_id: detail.series_id || detail.id?.toString(),
                book_title: detail.series_name || detail.title,
                book_pic: detail.vertical_cover_url || detail.horizontal_cover_url || detail.cover || detail.pic,
                description: detail.introduction || detail.desc || "",
                chapter_count: detail.max_series_no || detail.chapter_count || chapterBase.length,
                tag: Array.isArray(detail.tag_names) ? detail.tag_names.join(", ") : (detail.tag_names || ""),
                chapter_base: chapterBase
            };
            
            console.log(`[FlexTV Debug] Mapped Detail: ${bookDetail.book_title}, chapters=${bookDetail.chapter_base.length}`);

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
