/**
 * Optimize cover image URLs via wsrv.nl proxy.
 * Resizes to a max width and converts to WebP for smaller file sizes.
 */
export function optimizeCover(url: string | undefined, width = 400): string {
    if (!url) return "";
    // Already optimized or not a valid URL
    if (url.includes("wsrv.nl")) return url;
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=80`;
}
