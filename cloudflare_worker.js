/**
 * Cloudflare Worker for SekaiDrama Video Proxy
 * 
 * Purpose: Proxy video requests to bypass CORS and Referer protections, 
 * rewrites m3u8 playlists to point back to this worker, and streams content.
 * 
 * Usage: https://your-worker.subdomain.workers.dev/?url=...&referer=...
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get("url");
        const refererParam = url.searchParams.get("referer");
        const subParam = url.searchParams.get("sub"); // For injecting subtitles

        if (!targetUrl) {
            return new Response("Missing 'url' parameter", { status: 400 });
        }

        // Prepare headers for upstream request
        const upstreamHeaders = new Headers();
        upstreamHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        upstreamHeaders.set("Accept", "*/*");

        // Set Referer: Use provided referer or default to target's origin
        if (refererParam) {
            upstreamHeaders.set("Referer", refererParam);
        } else {
            try {
                const targetOrigin = new URL(targetUrl).origin + "/";
                upstreamHeaders.set("Referer", targetOrigin);
            } catch (e) {
                // Invalid target URL, ignore referer
            }
        }

        // Forward Range header if present (crucial for seeking in mp4)
        if (request.headers.has("Range")) {
            upstreamHeaders.set("Range", request.headers.get("Range"));
        }

        try {
            // Fetch upstream
            const response = await fetch(targetUrl, {
                headers: upstreamHeaders,
                method: "GET",
                redirect: "follow" // Workers handle redirects automatically
            });

            // Handle errors
            if (!response.ok) {
                return new Response(`Upstream Error: ${response.status} ${response.statusText}`, { status: response.status });
            }

            const contentType = response.headers.get("content-type") || "";
            const lowUrl = targetUrl.toLowerCase();

            // Check if it's an M3U8 playlist
            const isM3u8 = contentType.includes("application/vnd.apple.mpegurl") ||
                contentType.includes("application/x-mpegurl") ||
                lowUrl.includes(".m3u8");

            // Check if it's a Subtitle file (VTT/SRT)
            const isVtt = contentType.includes("text/vtt") || lowUrl.endsWith(".vtt") || lowUrl.endsWith(".srt");

            // --- CASE 1: M3U8 Playlist (Rewrite needed) ---
            if (isM3u8) {
                let text = await response.text();
                const workerOrigin = url.origin; // e.g., https://my-worker.workers.dev
                const baseUrl = new URL(response.url); // The actual final URL after redirects

                const createProxyUrl = (target) => {
                    let proxy = `${workerOrigin}/?url=${encodeURIComponent(target)}`;
                    if (refererParam) proxy += `&referer=${encodeURIComponent(refererParam)}`;
                    return proxy;
                };

                // Rewrite Logic
                const lines = text.split(/\r?\n/);
                const rewritedLines = lines.map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return line;

                    // Rewrite URI="..." attributes (e.g. key lines, subtitles)
                    if (trimmed.startsWith('#')) {
                        return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                            try {
                                const abs = new URL(uri, baseUrl).href;
                                return `URI="${createProxyUrl(abs)}"`;
                            } catch (e) { return match; }
                        });
                    }

                    // Rewrite segment URLs (lines that are not comments/tags)
                    try {
                        // If line is not a tag, it's a URL
                        if (!trimmed.startsWith('#')) {
                            const abs = new URL(trimmed, baseUrl).href;
                            return createProxyUrl(abs);
                        }
                    } catch (e) { return line; }

                    return line;
                });

                // Inject Subtitles if requested (NetShort style logic)
                let finalText = rewritedLines.join('\n');

                // Check for basic M3U8 validity before injecting
                const isMaster = finalText.includes("#EXT-X-STREAM-INF");

                if (isMaster && subParam) {
                    // Inject subtitle track
                    let proxiedSubUrl = `${workerOrigin}/?url=${encodeURIComponent(subParam)}`;
                    if (refererParam) proxiedSubUrl += `&referer=${encodeURIComponent(refererParam)}`;

                    const mediaLine = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Indonesia",DEFAULT=YES,AUTOSELECT=YES,LANGUAGE="id",URI="${proxiedSubUrl}"`;

                    finalText = finalText.replace("#EXTM3U", "#EXTM3U\n" + mediaLine);
                    finalText = finalText.replace(/#EXT-X-STREAM-INF:(.*)/g, (match, attrs) => {
                        if (attrs.includes("SUBTITLES=")) return match;
                        return `#EXT-X-STREAM-INF:${attrs},SUBTITLES="subs"`;
                    });
                }

                return new Response(finalText, {
                    status: 200,
                    headers: {
                        "Content-Type": "application/vnd.apple.mpegurl",
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "no-store"
                    }
                });
            }

            // --- CASE 2: Subtitles (VTT/SRT) ---
            if (isVtt) {
                let content = await response.text();

                // Convert SRT to VTT if needed
                if (lowUrl.endsWith(".srt") && !content.includes("WEBVTT")) {
                    content = content.replace(/\r\n/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
                    content = "WEBVTT\n\n" + content;
                }

                // Adjust positioning (optional, mimics your API logic)
                // content = content.replace(/((?:\d{2}:)?\d{2}:\d{2}\.\d{3} --> (?:\d{2}:)?\d{2}:\d{2}\.\d{3})(.*)/g, (m, t, r) => r.includes("line:") ? m : `${t} line:75%${r}`);

                return new Response(content, {
                    status: 200,
                    headers: {
                        "Content-Type": "text/vtt",
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "no-store"
                    }
                });
            }

            // --- CASE 3: Binary Streaming (MP4, TS segments) ---
            // We stream the response body directly
            const newHeaders = new Headers(response.headers);
            newHeaders.set("Access-Control-Allow-Origin", "*"); // Important: Enable CORS

            // Clean up headers that might cause issues
            newHeaders.delete("Content-Encoding"); // Let Cloudflare handle compression

            return new Response(response.body, {
                status: response.status,
                headers: newHeaders
            });

        } catch (e) {
            return new Response(`Worker Error: ${e.message}`, { status: 500 });
        }
    }
};
