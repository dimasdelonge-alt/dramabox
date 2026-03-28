import { safeJson } from "./api-utils";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/dramabox";

export class DramaBoxScraper {
    private static async fetchUpstream<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
        const query = new URLSearchParams(params as any).toString();
        const url = `${UPSTREAM_API}${path}${query ? '?' + query : ''}`;
        
        try {
            const response = await fetch(url, { 
                cache: 'no-store',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://sansekai.my.id/',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
                }
            });
            if (!response.ok) {
                const text = await response.text();
                console.error(`[DramaBoxScraper] Upstream error (${response.status}):`, text);
                throw new Error(`Failed to fetch from upstream: ${response.statusText}`);
            }
            return await safeJson<T>(response);
        } catch (error) {
            console.error(`[DramaBoxScraper] Error fetching ${path}:`, error);
            throw error;
        }
    }

    static async getForYou(page: number = 1) {
        const data = await this.fetchUpstream<any[]>("/foryou", { page });
        return Array.isArray(data) ? data.filter(item => item && item.bookId) : [];
    }

    static async getTrending() {
        const data = await this.fetchUpstream<any[]>("/trending");
        return Array.isArray(data) ? data.filter(item => item && item.bookId) : [];
    }

    static async getLatest() {
        const data = await this.fetchUpstream<any[]>("/latest");
        return Array.isArray(data) ? data.filter(item => item && item.bookId) : [];
    }

    static async search(keyword: string) {
        const data = await this.fetchUpstream<any[]>("/search", { query: keyword });
        return Array.isArray(data) ? data.filter(item => item && item.bookId) : [];
    }

    static async getDetail(bookId: string) {
        const data = await this.fetchUpstream<any>("/detail", { bookId });
        
        // Handle potential encrypted trailers in detail
        if (data && typeof data === 'object') {
            const book = data.book || (data.data?.book);
            if (book && book.videoPath && book.videoPath.includes('.encrypt.mp4')) {
                book.videoPath = `https://api.sansekai.my.id/api/dramabox/decrypt-stream?url=${encodeURIComponent(book.videoPath)}`;
            }
        }
        return data;
    }

    static async getEpisodes(bookId: string) {
        const data = await this.fetchUpstream<any>("/allepisode", { bookId });
        
        // Automatically wrap video URLs with the decryption proxy if they are encrypted
        if (Array.isArray(data)) {
            return data.map((episode: any) => {
                if (episode.cdnList) {
                    episode.cdnList = episode.cdnList.map((cdn: any) => {
                        if (cdn.videoPathList) {
                            cdn.videoPathList = cdn.videoPathList.map((vp: any) => {
                                if (vp.videoPath && vp.videoPath.includes('.encrypt.mp4')) {
                                    // Wrap with Sansekai's decryption-stream proxy
                                    vp.videoPath = `https://api.sansekai.my.id/api/dramabox/decrypt-stream?url=${encodeURIComponent(vp.videoPath)}`;
                                }
                                return vp;
                            });
                        }
                        return cdn;
                    });
                }
                return episode;
            });
        }
        return data;
    }

    static async getClassify(page: number = 1, classify: string = "terbaru") {
        const data = await this.fetchUpstream<any[]>("/dubindo", { page, classify });
        return Array.isArray(data) ? data.filter(item => item && item.bookId) : [];
    }
}
