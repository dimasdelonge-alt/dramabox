
import { FlexTVScraper } from "./src/lib/flextv-scraper";

async function debug() {
    console.log("=== DEBUG HOMEPAGE ===");
    const hp = await FlexTVScraper.getHomepage();
    if (hp?.data?.list) {
        console.log("HP List Length:", hp.data.list.length);
        console.log("First item keys:", Object.keys(hp.data.list[0]));
        console.log("First item sample:", JSON.stringify(hp.data.list[0], null, 2));
    } else {
        console.log("HP Data:", JSON.stringify(hp, null, 2));
    }

    console.log("\n=== DEBUG SEARCH ===");
    const sr = await FlexTVScraper.search("Hot");
    if (sr?.data?.list) {
        console.log("SR List Length:", sr.data.list.length);
        console.log("First item keys:", Object.keys(sr.data.list[0]));
        console.log("First item sample:", JSON.stringify(sr.data.list[0], null, 2));
    }

    console.log("\n=== DEBUG DETAIL KEYS ===");
    const id = "10419"; // Sample ID if known, or try to get from HP/SR
    const dt = await FlexTVScraper.getDramaDetail(id);
    if (dt?.data) {
        console.log("Detail keys:", Object.keys(dt.data));
        if (dt.data.section_list) console.log("Section list length:", dt.data.section_list.length);
        if (dt.data.list) console.log("List length:", dt.data.list.length);
    }
}

debug();
