
import { NextResponse } from "next/server";
import { FlexTVScraper } from "@/lib/flextv-scraper";
import { encryptedResponse } from "@/lib/api-utils";

export async function GET() {
    try {
        const res = await FlexTVScraper.getHomepage();
        const rawList = (res && res.code === 0 && res.data?.list && Array.isArray(res.data.list)) ? res.data.list : [];
        
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
                tag: safeJoin(b.tag_names || b.tag)
            };
        };

        let lists: any[] = [];

        // Determine if rawList is a list of floors or a list of dramas
        const isFlatList = rawList.length > 0 && (rawList[0].series_id || rawList[0].series_name);

        if (isFlatList) {
            console.log("[FlexTV Debug] Detected flat drama list on homepage");
            const books = rawList.map(mapDrama).filter((b: any) => b && b.book_id);
            lists.push({
                tab_id: 1,
                title: "Trending FlexTV",
                books: books,
                banners: books.slice(0, 5).map((b: any) => ({
                    pic: b.horizontal_cover || b.book_pic,
                    jump_param: { book_id: b.book_id, book_title: b.book_title },
                    play_button: 1
                }))
            });
        } else {
            console.log("[FlexTV Debug] Detected nested floor list on homepage");
            lists = rawList.map((floor: any, idx: number) => {
                const floorBooks = (floor.list || floor.seriesList || floor.data || []).map(mapDrama).filter((b: any) => b && b.book_id);
                const fName = floor.floor_name || floor.name || floor.title || `Section ${idx + 1}`;
                return {
                    tab_id: floor.floor_id || floor.id || idx,
                    title: fName,
                    books: floorBooks,
                    banners: (fName.toLowerCase().includes("hot") || floor.floor_id === 10739) ? floorBooks.slice(0, 5).map((b: any) => ({
                        pic: b.horizontal_cover || b.book_pic,
                        jump_param: { book_id: b.book_id, book_title: b.book_title },
                        play_button: 1
                    })) : []
                };
            }).filter((l: any) => l.books.length > 0);
        }

        // Search fallback if still empty
        if (lists.length === 0) {
            console.log("[FlexTV Debug] Lists still empty, trying search fallback...");
            const searchRes = await FlexTVScraper.search("Hot");
            const searchList = (searchRes?.data?.list && Array.isArray(searchRes.data.list)) ? searchRes.data.list : [];
            if (searchList.length > 0) {
                const fallbackBooks = searchList.map(mapDrama).filter((b: any) => b && b.book_id);
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

        if (lists.length === 0) {
            return NextResponse.json({ error: "No data available" }, { status: 404 });
        }

        return encryptedResponse({
            success: true,
            data: {
                tab_list: lists.map((l: any) => ({ tab_id: l.tab_id, tab_name: l.title.toUpperCase() })),
                lists
            }
        });

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
