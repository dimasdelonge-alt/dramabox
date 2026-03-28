
import { FlexTVScraper } from "./src/lib/flextv-scraper";

async function debugHomepageLogic() {
    console.log("--- SIMULATING HOMEPAGE ROUTE LOGIC ---");
    
    const res = await FlexTVScraper.getHomepage();
    console.log("[FlexTV Debug] Raw res code:", res?.code);
    
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

    let lists = floors.map((floor: any) => {
        const floorBooks = (floor.list || []).map(mapDrama).filter((b: any) => b && b.book_id);
        console.log(`[FlexTV Debug] Floor "${floor.floor_name}" (ID: ${floor.floor_id}) has ${floorBooks.length} books`);
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

    if (lists.length === 0) {
        console.log("[FlexTV Debug] Homepage floors empty, trying search fallback...");
        const searchRes = await FlexTVScraper.search("Hot");
        console.log("[FlexTV Debug] Search response code:", searchRes?.code);
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

    console.log("[FlexTV Debug] Final lists length:", lists.length);
    if (lists.length === 0) {
        console.log("RESULT: Would return 404");
    } else {
        console.log("RESULT: Success! First section books:", lists[0].books.length);
    }
}

debugHomepageLogic();
