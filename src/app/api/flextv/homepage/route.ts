
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET() {
    try {
        const res = await FlexTVScraper.getHomepage();
        const floors = (res && res.code === 0 && res.data?.list) ? res.data.list : [];
        
        const mapDrama = (b: any) => ({
            book_id: b.series_id,
            book_title: b.series_name,
            book_pic: b.vertical_cover_url || b.horizontal_cover_url,
            horizontal_cover: b.horizontal_cover_url,
            description: b.introduction,
            chapter_count: b.max_series_no,
            tag: b.tag_names?.join(", ")
        });

        // Map floors to lists
        const lists = floors.map((floor: any) => ({
            tab_id: floor.floor_id,
            title: floor.floor_name,
            books: (floor.list || []).map(mapDrama),
            banners: floor.floor_name === "Hot" ? (floor.list || []).slice(0, 5).map((b: any) => ({
                pic: b.horizontal_cover_url || b.vertical_cover_url,
                jump_param: {
                    book_id: b.series_id,
                    book_title: b.series_name
                },
                play_button: 1
            })) : []
        })).filter((l: any) => l.books.length > 0);

        // If homepage is too empty, add search fallback
        if (lists.length === 0 || (lists.length === 1 && lists[0].books.length < 5)) {
            const searchRes = await FlexTVScraper.search("Hot");
            if (searchRes?.data?.list) {
                const fallbackBooks = searchRes.data.list.map(mapDrama);
                lists.push({
                    tab_id: 999,
                    title: "Rekomendasi FlexTV",
                    books: fallbackBooks,
                    banners: lists.length === 0 ? fallbackBooks.slice(0, 5).map((b: any) => ({
                        pic: b.horizontal_cover || b.book_pic,
                        jump_param: { book_id: b.book_id, book_title: b.book_title },
                        play_button: 1
                    })) : []
                });
            }
        }

        return encryptedResponse({
            success: true,
            data: {
                tab_list: lists.map((l: any) => ({ tab_id: l.tab_id, tab_name: l.title.toUpperCase() })),
                lists
            }
        });

        return NextResponse.json({ error: "Failed to fetch FlexTV data" }, { status: 500 });
    } catch (error) {
        console.error("[FlexTV API] Homepage Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
