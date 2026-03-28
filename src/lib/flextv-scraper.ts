
import CryptoJS from "crypto-js";

export class FlexTVScraper {
    private static BASE_URL = "https://api-quick.flextv.cc";
    private static APP_ID = "52u3itng7y4omkja";
    private static SECRET = "FifZlSY4nb0eg6k8oDG2xC3UIMOwdBru";
    private static DEFAULT_LANG = "id";
    private static DEVICE_NUMBER = "623a02e4-607e-4010-84b2-ed84732f9c26";

    private static AES_KEY = CryptoJS.enc.Utf8.parse("qJZCGsxOPrUFuiz2");
    private static AES_IV = CryptoJS.enc.Utf8.parse("3zxNedKJCoLV4Fi7");

    private static getMD5(text: string): string {
        return CryptoJS.MD5(text).toString().toLowerCase();
    }

    private static getHmacSha256(message: string, secret: string): string {
        return CryptoJS.HmacSHA256(message, secret).toString().toLowerCase();
    }

    private static generateSignature(endpoint: string, params: any, timestamp: number) {
        const fullApiPath = `${this.BASE_URL}${endpoint}`.toLowerCase();
        const apiUrlMd5 = this.getMD5(fullApiPath);

        const p: any = {
            apiUrl: apiUrlMd5,
            appId: this.APP_ID,
            lang: this.DEFAULT_LANG,
            timestamp: timestamp.toString(),
            deviceNumber: this.DEVICE_NUMBER
        };

        if (params) {
            for (const key in params) {
                if (typeof params[key] !== 'object' && params[key] !== undefined) {
                    p[key] = params[key].toString();
                }
            }
        }

        const sortedKeys = Object.keys(p).sort();
        let m = "";
        for (const key of sortedKeys) {
            if (p[key] !== undefined && p[key] !== "") {
                m += `${key}${p[key]}`;
            }
        }

        const sig = this.getHmacSha256(m, this.SECRET);
        return { signature: sig, apiUrlHeader: apiUrlMd5 };
    }

    private static decrypt(ciphertext: string): string | null {
        try {
            const decrypted = CryptoJS.AES.decrypt(ciphertext, this.AES_KEY, {
                iv: this.AES_IV,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("[FlexTVScraper] Decryption error:", e);
            return null;
        }
    }

    private static async request(method: string, endpoint: string, params: any = null, body: any = null) {
        const timestamp = Math.floor(Date.now() / 1000);
        const { signature, apiUrlHeader } = this.generateSignature(endpoint, params || body, timestamp);

        const headers: any = {
            "apiurl": apiUrlHeader,
            "signature": signature,
            "timestamp": timestamp.toString(),
            "appid": this.APP_ID,
            "lang": this.DEFAULT_LANG,
            "devicenumber": this.DEVICE_NUMBER,
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        };

        let url = `${this.BASE_URL}${endpoint}`;
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        }

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            if (!res.ok) {
                console.error(`[FlexTVScraper] Request failed: ${res.status} - ${endpoint}`);
                return null;
            }

            const json = await res.json();
            if (json.is_encrypt === 1 && json.data) {
                const dec = this.decrypt(json.data);
                if (dec) {
                    json.data = JSON.parse(dec);
                }
            }
            return json;
        } catch (e) {
            console.error(`[FlexTVScraper] Fetch error: ${endpoint}`, e);
            return null;
        }
    }

    static async getHomepage(floorId = 10739) {
        return this.request("GET", "/floorData", {
            page_no: 1,
            page_size: 18,
            floor_id: floorId
        });
    }

    static async search(keywords: string) {
        return this.request("GET", "/webSearchSeries", {
            keyword: keywords,
            page_no: 1,
            page_size: 20
        });
    }

    static async getDramaDetail(seriesId: string) {
        // We use webGetSeriesSectionFullList as it provides more metadata + episode list in one go
        return this.request("GET", "/webGetSeriesSectionFullList", {
            series_id: seriesId,
            series_no: 1,
            is_all: 0
        });
    }

    static async getEpisodeStream(seriesId: string, seriesNo: number) {
        const res = await this.request("GET", "/webGetSeriesSectionFullList", {
            series_id: seriesId,
            series_no: seriesNo,
            is_all: 0
        });
        
        if (res?.data?.play_info?.video_url) {
            return {
                videoList: [{
                    url: res.data.play_info.video_url,
                    quality: 0,
                    encode: "H264"
                }],
                success: true
            };
        }
        return null;
    }
}
