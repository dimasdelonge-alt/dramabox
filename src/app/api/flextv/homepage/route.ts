
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET() {
    try {
        const res = await FlexTVScraper.getHomepage();
        console.log("[FlexTV Debug] Homepage response:", res ? "OK" : "FAILED", res?.code);

        const floors = (res && res.code === 0 && res.data?.list && Array.isArray(res.data.list)) ? res.data.list : [];
        console.log("[FlexTV Debug] Floor count:", floors.length);

        const safeJoin = (arr: any) => {
            if (Array.isArray(arr)) return arr.join(", ");
            if (typeof arr === "string") return arr;
            return "";
        };

        const mapDrama = (b: any) => {
            if (!b) return null;
            return {
                book_id: b.series_id || b.id?.toString(),
                book_title: b.series_name || b.title,
                book_pic: b.vertical_cover_url || b.horizontal_cover_url || b.cover || b.pic,
                horizontal_cover: b.horizontal_cover_url || b.cover || b.pic,
                description: b.introduction || b.desc || "",
                chapter_count: b.max_series_no || b.chapter_count || 0,
                tag: safeJoin(b.tag_names)
            };
        };

        // Map floors to lists
        let lists = floors.map((floor: any) => {
            const floorBooks = (floor.list || []).map(mapDrama).filter((b: any) => b && b.book_id);
            console.log(`[FlexTV Debug] Floor "${floor.floor_name}" has ${floorBooks.length} books`);
            return {
                tab_id: floor.floor_id,
                title: floor.floor_name || "Trending",
                books: floorBooks,
                banners: (floor.floor_name === "Hot" || floor.floor_id === 10739) ? floorBooks.slice(0, 5).map((b: any) => ({
                    pic: b.horizontal_cover || b.book_pic,
                    jump_param: {
                        book_id: b.book_id,
                        book_title: b.book_title
                    },
                    play_button: 1
                })) : []
            };
        }).filter((l: any) => l.books.length > 0);

        // If homepage is too empty, add search fallback
        if (lists.length === 0) {
            console.log("[FlexTV Debug] Homepage floors empty, trying search fallback...");
            const searchRes = await FlexTVScraper.search("Hot");
            console.log("[FlexTV Debug] Search response:", searchRes ? "OK" : "FAILED", searchRes?.code);
            const searchList = (searchRes?.data?.list && Array.isArray(searchRes.data.list)) ? searchRes.data.list : [];
            if (searchList.length > 0) {
                const fallbackBooks = searchList.map(mapDrama).filter((b: any) => b && b.book_id);
                console.log("[FlexTV Debug] Search fallback found books:", fallbackBooks.length);
                lists.push({
                    tab_id: 999,
                    title: "Rekomendasi FlexTV",
                    books: fallbackBooks,
                    banners: fallbackBooks.slice(0, 5).map((b: any) => ({
                        pic: b.horizontal_cover || b.book_pic,
                        jump_param: { book_id: b.book_id, book_title: b.book_title },
                        play_button: 1
                    }))
                });
            }
        }

        // Final safety check
        if (lists.length === 0) {
            console.warn("[FlexTV Debug] Final lists is still empty. 404 returned.");
            return NextResponse.json({ 
                error: "No data available", 
                debug: { 
                    res_hp: res ? res.code : "null", 
                    floors_len: floors.length 
                } 
            }, { status: 404 });
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
