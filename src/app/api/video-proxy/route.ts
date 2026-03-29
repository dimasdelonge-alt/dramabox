import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const range = request.headers.get("range");
    console.log(`[VideoProxy] PROXYING: ${targetUrl} (Range: ${range || 'none'})`);
    
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "com.ss.android.ugc.tiktok.lite/2024309010 (Linux; U; Android 9; id_ID; PGT-AN10; Build/PQ3A.190801.002; Cronet/TTNetVersion:1774704775)",
      "Referer": "https://www.tiktok.com/",
    };
    if (range) fetchHeaders["Range"] = range;

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
      cache: 'no-store'
    });

    console.log(`[VideoProxy] Upstream Status: ${response.status} | Content-Type: ${response.headers.get('content-type')} | Content-Length: ${response.headers.get('content-length')}`);

    if (!response.ok && response.status !== 206) {
      const errorText = await response.text();
      console.error(`[VideoProxy] Upstream Error Body: ${errorText.substring(0, 200)}`);
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
    }

    // Proxy the relevant headers
    const headers = new Headers();
    const headersToProxy = ["content-type", "content-length", "content-range", "accept-ranges"];
    
    headersToProxy.forEach(h => {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    });
    
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "no-cache");

    // Stream the body
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error(`[VideoProxy] EXCEPTION: ${error.message}`);
    return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
  }
}
