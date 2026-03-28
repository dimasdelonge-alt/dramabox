
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const keywords = searchParams.get("keywords") || "";
        
        if (!keywords) {
            return NextResponse.json({ error: "Missing keywords" }, { status: 400 });
        }

        const res = await FlexTVScraper.search(keywords);
        
        if (res && res.code === 0 && res.data?.list && Array.isArray(res.data.list)) {
            const mapDrama = (b: any) => {
                if (!b) return null;
                return {
                    book_id: b.series_id || b.id?.toString(),
                    book_title: b.series_name || b.title,
                    book_pic: b.vertical_cover_url || b.horizontal_cover_url || b.cover || b.pic,
                    horizontal_cover: b.horizontal_cover_url || b.cover || b.pic,
                    description: b.introduction || b.desc || "",
                    chapter_count: b.max_series_no || b.chapter_count || 0,
                    tag: Array.isArray(b.tag_names) ? b.tag_names.join(", ") : (b.tag_names || "")
                };
            };
            const books = res.data.list.map(mapDrama).filter(Boolean);

            return encryptedResponse({
                success: true,
                data: books
            });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error) {
        console.error("[FlexTV API] Search Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
