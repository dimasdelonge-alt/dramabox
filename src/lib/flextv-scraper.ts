import crypto from 'crypto';

export class FlexTVScraper {
    private static BASE_URL = "https://api-quick.flextv.cc";
    private static KEY = "u8U9Y7f6e5D4c3B2";
    private static IV = "u8U9Y7f6e5D4c3B2";
    private static SALT = "f9ea93e6";

    private static generateSignature(timestamp: string, relativeUrl: string, token: string = "") {
        // FlexTV signature uses the relative URL without leading slash
        const urlForSign = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
        const input = `${timestamp}&${urlForSign}&${token}&${this.SALT}`;
        return crypto.createHash('sha256').update(input).digest('hex').toLowerCase();
    }

    static decrypt(ciphertext: string) {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-128-cbc',
                Buffer.from(this.KEY),
                Buffer.from(this.IV)
            );
            decipher.setAutoPadding(true);
            let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            // Sometimes it's already a string or JSON if not encrypted
            return ciphertext;
        }
    }

    static async fetchApi(path: string, params: Record<string, string> = {}) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const query = new URLSearchParams(params).toString();
        const relativeUrl = `${path.startsWith('/') ? path.substring(1) : path}${query ? "?" + query : ""}`;
        const fullUrl = `${this.BASE_URL}/${relativeUrl}`;

        // Assume empty token if we don't have one
        const token = "";
        const signature = this.generateSignature(timestamp, relativeUrl, token);

        const headers: Record<string, string> = {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "timestamp": timestamp,
            "signature": signature,
            "appId": "858mw3lnr40rxbca",
            "getid": "7",
            "api-url": "bc3dfd298e4eb8558588e841d2742623",
            "lang": "id",
            "Origin": "https://www.flextv.cc",
            "Referer": "https://www.flextv.cc/",
            "token": token
        };

        try {
            const res = await fetch(fullUrl, { headers });
            const text = await res.text();
            console.log(`[FlexTV Debug] HTTP Status: ${res.status}`);
            console.log(`[FlexTV Debug] Raw Response: ${text.substring(0, 200)}`);

            const json = JSON.parse(text);

            if (json.is_encrypt && json.data) {
                return this.decrypt(json.data);
            }
            return json.data || json;
        } catch (error) {
            console.error("FlexTV API Fetch Error:", error);
            return {};
        }
    }

    static async getHomepage() {
        return this.fetchApi("/api/v1/hall/info");
    }

    static async getDramaDetail(seriesId: string) {
        return this.fetchApi("/api/v1/video/detail", { series_id: seriesId });
    }

    static async search(keyword: string) {
        return this.fetchApi("/api/v1/search/keywords", { keyword, page: "1", page_size: "20" });
    }
}
