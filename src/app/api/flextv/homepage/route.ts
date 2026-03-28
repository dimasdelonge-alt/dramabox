
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET() {
    try {
        const res = await FlexTVScraper.getHomepage();
        let rawBooks = (res && res.code === 0 && res.data?.list) ? res.data.list : [];
        
        // If homepage is empty or small, mix with some popular search results as fallback
        if (rawBooks.length < 5) {
            const searchRes = await FlexTVScraper.search("Hot");
            if (searchRes?.data?.list) {
                rawBooks = [...rawBooks, ...searchRes.data.list];
            }
        }

        const mapDrama = (b: any) => ({
            book_id: b.series_id,
            book_title: b.series_name,
            book_pic: b.vertical_cover_url || b.horizontal_cover_url,
            horizontal_cover: b.horizontal_cover_url,
            description: b.introduction,
            chapter_count: b.max_series_no,
            tag: b.tag_names?.join(", ")
        });

        const books = rawBooks.map(mapDrama);
        
        // Create multiple sections for a better look
        const lists = [
            {
                tab_id: 1,
                title: "Trending FlexTV",
                books: books.slice(0, 12),
                banners: books.slice(0, 5).map((b: any) => ({
                    pic: b.horizontal_cover || b.book_pic,
                    jump_param: {
                        book_id: b.book_id,
                        book_title: b.book_title
                    },
                    play_button: 1
                }))
            }
        ];

        // Add "Rekomendasi" section if we have enough books
        if (books.length > 12) {
            lists.push({
                tab_id: 2,
                title: "Rekomendasi",
                books: books.slice(12, 24),
                banners: []
            });
        }

        return encryptedResponse({
            success: true,
            data: {
                tab_list: [
                    { tab_id: 1, tab_name: "TERBARU" },
                    { tab_id: 2, tab_name: "REKOMENDASI" }
                ],
                lists
            }
        });

        return NextResponse.json({ error: "Failed to fetch FlexTV data" }, { status: 500 });
    } catch (error) {
        console.error("[FlexTV API] Homepage Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
