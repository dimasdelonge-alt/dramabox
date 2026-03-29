import { NextResponse } from "next/server";
import { encryptData } from "@/lib/crypto";

export async function safeJson<T>(response: Response): Promise<T> {
  let text = await response.text();
  if (!text || !text.trim()) {
    throw new Error(`Empty response from upstream: ${response.url}`);
  }

  // Fix for 64-bit integers rounding in TikTok/PineDrama APIs
  // Find long numbers (15+ digits) and wrap them in quotes if they aren't already
  text = text.replace(/:\s*(\d{15,})/g, ': "$1"');

  try {
    const contentType = response.headers.get("content-type") || "";
    console.log(`Upstream Response [${response.url.substring(0, 50)}...] Content-Type: ${contentType}`);
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    console.error("Raw Text (truncated):", text.substring(0, 200));
    throw new Error("Invalid JSON response from upstream");
  }
}

export function encryptedResponse(data: any, status = 200) {
  const encrypted = encryptData(data);
  return NextResponse.json({ success: true, data: encrypted }, { status });
}
