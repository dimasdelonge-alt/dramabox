
const { FlexTVScraper } = require("./src/lib/flextv-scraper");

async function test() {
    console.log("--- Testing FlexTVScraper (TS Version) ---");
    
    console.log("[1] Testing Homepage...");
    const home = await FlexTVScraper.getHomepage();
    if (home && home.code === 0 && home.data?.list) {
        const drama = home.data.list[0];
        console.log(`Success! Found: ${drama.series_name} (ID: ${drama.series_id})`);
        
        console.log(`\n[2] Testing Detail and Playback for ${drama.series_id}...`);
        const stream = await FlexTVScraper.getEpisodeStream(drama.series_id, 1);
        if (stream && stream.success) {
            console.log(`Success! Stream URL: ${stream.videoList[0].url.substring(0, 100)}...`);
        } else {
            console.log("Failed to get stream.");
        }
    } else {
        console.log("Failed to get homepage.");
        console.log(JSON.stringify(home, null, 2));
    }
}

test();
