import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/shortmax";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const shortPlayId = searchParams.get("shortPlayId");

        if (!shortPlayId) {
            return encryptedResponse(
                { success: false, error: "shortPlayId is required" },
                400
            );
        }

        const response = await fetch(
            `${UPSTREAM_API}/allepisode?shortPlayId=${shortPlayId}`,
            { cache: 'no-store' }
        );

        if (!response.ok) {
            return encryptedResponse(
                { success: false, error: "Failed to fetch episodes" }
            );
        }

        const data = await safeJson<any>(response);

        if (data.status !== "ok" || !data.episodes) {
            return encryptedResponse(
                { success: false, error: "Episodes not found" }
            );
        }

        // Map all episodes and proxy-rewrite video URLs for AES decryption
        const episodes = data.episodes.map((ep: any) => {
            const videoUrl: Record<string, string> = {};
            if (ep.videoUrl) {
                for (const [quality, url] of Object.entries(ep.videoUrl)) {
                    if (typeof url === "string" && url) {
                        videoUrl[quality] = `/api/shortmax/hls?url=${encodeURIComponent(url)}`;
                    }
                }
            }

            return {
                episodeNumber: ep.episodeNumber,
                id: ep.id,
                duration: ep.duration,
                locked: ep.locked,
                needDecrypt: ep.needDecrypt,
                cover: ep.cover,
                videoUrl,
            };
        });

        return encryptedResponse({
            success: true,
            shortPlayId: data.shortPlayId,
            shortPlayName: data.shortPlayName,
            totalEpisodes: data.totalEpisodes,
            count: data.count,
            episodes,
        });
    } catch (error) {
        console.error("ShortMax AllEpisode Error:", error);
        return encryptedResponse(
            { success: false, error: "Internal server error" }
        );
    }
}
