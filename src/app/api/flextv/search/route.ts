
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
        
        if (res && res.code === 0 && res.data?.list) {
            const books = res.data.list.map((b: any) => ({
                book_id: b.series_id,
                book_title: b.series_name,
                book_pic: b.vertical_cover_url || b.horizontal_cover_url,
                horizontal_cover: b.horizontal_cover_url,
                description: b.introduction,
                chapter_count: b.max_series_no,
                tag: b.tag_names?.join(", ")
            }));

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
