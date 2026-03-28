
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET() {
    try {
        const res = await FlexTVScraper.getHomepage();
        
        if (res && res.code === 0 && res.data?.list) {
            const rawBooks = res.data.list;
            
            // Map FlexTV data to SekaiDrama common format
            const books = rawBooks.map((b: any) => ({
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
                data: {
                    tab_list: [{ tab_id: 1, tab_name: "TERBARU" }],
                    lists: [
                        {
                            tab_id: 1,
                            title: "Trending FlexTV",
                            books: books,
                            banners: books.slice(0, 5).map((b: any) => ({
                                pic: b.horizontal_cover || b.book_pic,
                                jump_param: {
                                    book_id: b.book_id,
                                    book_title: b.book_title
                                },
                                play_button: 1
                            }))
                        }
                    ]
                }
            });
        }

        return NextResponse.json({ error: "Failed to fetch FlexTV data" }, { status: 500 });
    } catch (error) {
        console.error("[FlexTV API] Homepage Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
