import { safeJson } from "./api-utils";

export interface ReelShortDrama {
    book_id: string;
    book_title: string;
    chapter_count: number;
    chapter_base: any[];
}

export class ReelShortScraper {
    private static BASE_URL = "https://www.reelshort.com";
    private static HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Origin": "https://www.reelshort.com",
        "Referer": "https://www.reelshort.com/",
    };

    private static buildId: string | null = null;
    
    // Server-side book cache: book_id -> full book data (including chapter_base)
    private static bookCache: Map<string, any> = new Map();
    private static cacheTimestamp: number = 0;
    private static CACHE_TTL = 1000 * 60 * 10; // 10 minutes

    static async getBuildId() {
        if (this.buildId) return this.buildId;
        try {
            const res = await fetch(this.BASE_URL, { headers: this.HEADERS });
            const html = await res.text();
            const data = this.extractNextData(html);
            this.buildId = data?.buildId || null;
            return this.buildId;
        } catch (e) {
            return null;
        }
    }

    private static extractNextData(html: string) {
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    private static findBooksInObject(obj: any) {
        if (!obj || typeof obj !== 'object') return;
        
        // Cache book if it has ID and Title
        if (obj.book_id && obj.book_title) {
            const existing = this.bookCache.get(obj.book_id);
            // Replace if new one has more info (like chapters)
            if (!existing || (!existing.chapter_base && obj.chapter_base)) {
                this.bookCache.set(obj.book_id, obj);
            }
        }

        // Normalisasi chapter_base jika ada
        if (Array.isArray(obj.chapter_base)) {
            obj.chapter_base.forEach((ch: any, i: number) => {
                if (!ch.serial_number) {
                    // Coba ambil dari chapter_name (mis: "Episode 1" -> 1)
                    const numMatch = ch.chapter_name?.match(/Episode\s+(\d+)/i) || ch.title?.match(/Episode\s+(\d+)/i);
                    ch.serial_number = numMatch ? parseInt(numMatch[1], 10) : i + 1;
                }
            });
        }

        // Deep Search
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const val = obj[key];
                if (Array.isArray(val)) {
                    val.forEach(item => this.findBooksInObject(item));
                } else if (typeof val === 'object' && val !== null) {
                    this.findBooksInObject(val);
                }
            }
        }
    }

    static async search(query: string) {
        try {
            const bId = await this.getBuildId();
            if (!bId) return [];
            const url = `${this.BASE_URL}/_next/data/${bId}/en/search.json?keywords=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { ...this.HEADERS, "x-nextjs-data": "1" } });
            const json = await res.json();
            return json.pageProps?.books || [];
        } catch (e) {
            return [];
        }
    }

    private static async initCache() {
        if (this.bookCache.size === 0 || (Date.now() - this.cacheTimestamp) > this.CACHE_TTL) {
            await this.getHomepage();
        }
    }

    static async getBookDetail(bookId: string): Promise<any> {
        await this.initCache();
        
        let book = this.bookCache.get(bookId);
        // Only return from cache if it has chapters
        if (book && book.chapter_base && book.chapter_base.length > 0) return book;

        console.log(`[ReelShort] Cache miss or incomplete data for ${bookId}. Trying fallbacks...`);

        // FALLBACK 1: Search API (Resolves Alias IDs to Real IDs)
        const searchResults = await this.search(bookId);
        if (searchResults.length > 0) {
            // Check for EXACT ID match or handle as alias
            const result = searchResults.find((r: any) => r.book_id === bookId) || searchResults[0];
            const realId = result.book_id;
            
            // SECURITY CHECK: If searching by ID returned a DIFFERENT book, 
            // and neither ID matches what we asked, it might be a fuzzy search error.
            if (realId !== bookId && !result.book_title.toLowerCase().includes(bookId.toLowerCase())) {
                console.log(`[ReelShort] Search for ${bookId} returned mismatch: ${result.book_title} (${realId}). Ignoring.`);
            } else {
                console.log(`[ReelShort] Found via Search: ${bookId} -> ${realId}`);
                // Proceed with existing logic...
                book = this.bookCache.get(realId);
                if (book && book.chapter_base) return book;

                // FALLBACK 2: Direct Book Page HTML (using realId)
                const locales = ["en", "id", ""];
                for (const locale of locales) {
                    const prefix = locale ? `/${locale}` : "";
                    const url = `https://www.reelshort.com${prefix}/book/drama-${realId}`;
                    try {
                        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
                        if (res.status === 200) {
                            const html = await res.text();
                            const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
                            if (match) {
                                const data = JSON.parse(match[1]);
                                this.findBooksInObject(data);
                                book = this.bookCache.get(realId);
                                if (book && book.chapter_base) return book;
                            }
                        }
                    } catch (e) {
                        console.error(`[ReelShort] Direct HTML fetch failed for locale ${locale}:`, e);
                    }
                }

                if (result) {
                    console.log(`[ReelShort] Using Search Result Meta as fallback for ${bookId}`);
                    return {
                        book_id: realId,
                        book_title: result.book_title,
                        book_pic: result.book_pic,
                        description: result.special_desc || result.tag || "No description available",
                        chapter_count: result.chapter_count || 1,
                        chapter_base: Array.from({ length: result.chapter_count || 1 }, (_, i) => ({
                            chapter_id: i === 0 ? result.first_chapter_id : `EP-${i + 1}`,
                            serial_number: i + 1,
                            chapter_title: `Episode ${i + 1}`
                        })),
                        success: true
                    };
                }
            }
        }

        console.error(`[ReelShort] All detail fallbacks failed for ${bookId}`);
        return null;
    }

    static async getDramaDetail(bookId: string) {
        return this.getBookDetail(bookId);
    }

    static async getEpisodeStream(bookId: string, episodeNum: number): Promise<any> {
        console.log(`[ReelShort] Getting stream for Book: ${bookId}, Ep: ${episodeNum}`);
        
        let book = await this.getBookDetail(bookId);
        if (!book) return null;

        let ep = book.chapter_base?.find((c: any) => c.serial_number === episodeNum);
        
        // Fallback: If not found by serial_number, but it's Episode 1 and we have first_chapter_id
        if (!ep && episodeNum === 1 && book.first_chapter_id) {
            ep = { chapter_id: book.first_chapter_id, serial_number: 1 };
        }
        
        // Fallback: Just take index if within bounds
        if (!ep && book.chapter_base && book.chapter_base.length >= episodeNum) {
            ep = book.chapter_base[episodeNum - 1];
        }

        if (!ep) {
            console.error(`[ReelShort] Episode ${episodeNum} not found in book ${bookId}`);
            return null;
        }

        const chapterId = ep.chapter_id;
        console.log(`[ReelShort] Resolved Chapter ID: ${chapterId}`);

        // STRATEGY: HTML Scraping (Bypasses TLS Fingerprinting on API)
        const locales = ["en", "id", ""];
        for (const locale of locales) {
            const prefix = locale ? `/${locale}` : "";
            // Use dummy slug since id is at the end
            const url = `https://www.reelshort.com${prefix}/episodes/episode-${episodeNum}-any-slug-${book.book_id}-${chapterId}`;
            
            try {
                const res = await fetch(url, { 
                    headers: { 
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    } 
                });

                if (res.status === 200) {
                    const html = await res.text();
                    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
                    if (match) {
                        try {
                            const data = JSON.parse(match[1]);
                            const video_url = data?.props?.pageProps?.data?.video_url;
                            if (video_url) {
                                console.log(`[ReelShort] Success! Video URL found in locale: ${locale}`);
                                return {
                                    videoList: [{ 
                                        url: video_url, 
                                        video_url: video_url,
                                        quality: 0,
                                        encode: "H264"
                                    }], 
                                    success: true
                                };
                            }
                        } catch (e) {
                            console.error("[ReelShort] JSON parse error in scrape:", e);
                        }
                    }
                }
                console.log(`[ReelShort] Locale ${locale || "root"} failed with status ${res.status}`);
            } catch (e) {
                console.error(`[ReelShort] Fetch error in locale ${locale}:`, e);
            }
        }

        console.error(`[ReelShort] Failed to extract video URL for ${bookId} Ep ${episodeNum}`);
        return null;
    }

    static async getHomepage() {
        const data = await this.getHomepageData();
        return data.books;
    }

    static async getHomepageData() {
        try {
            const allShelves: any[] = [];
            const seenIds = new Set<string>();
            const locales = ["/id", ""];
            
            for (const locale of locales) {
                const url = `${this.BASE_URL}${locale}`;
                const res = await fetch(url, { headers: { ...this.HEADERS, "Accept-Language": locale === "/id" ? "id-ID,id;q=0.9" : "en-US,en;q=0.9" } });
                if (!res.ok) continue;
                
                const html = await res.text();
                const data = this.extractNextData(html);
                if (!data?.props?.pageProps) continue;

                const pageProps = data.props.pageProps;
                this.findBooksInObject(pageProps);

                // Deep search for hall/info shelves
                let hallInfo = pageProps.fallback?.["/api/video/hall/info"] || pageProps["/api/video/hall/info"];
                if (!hallInfo) {
                    // Try searching keys
                    for (const key in (pageProps.fallback || {})) {
                        if (key.includes("hall/info")) {
                            hallInfo = pageProps.fallback[key];
                            break;
                        }
                    }
                }

                if (hallInfo) {
                    const sections = hallInfo.list || hallInfo.bookShelfList || [];
                    sections.forEach((section: any) => {
                        const title = section.title || section.name;
                        const books = section.books || section.list || [];
                        if (books.length > 0 && title) {
                            allShelves.push({
                                title,
                                books: books.map((b: any) => {
                                    seenIds.add(b.book_id);
                                    return b;
                                })
                            });
                        }
                    });
                }
            }

            const allBooks = Array.from(this.bookCache.values());
            return {
                books: allBooks,
                shelves: allShelves.length > 0 ? allShelves : [{ title: "Terbaru", books: allBooks }]
            };
        } catch (e) {
            console.error("[ReelShort] Homepage data error:", e);
            const allBooks = Array.from(this.bookCache.values());
            return { books: allBooks, shelves: [{ title: "Terbaru", books: allBooks }] };
        }
    }
}
