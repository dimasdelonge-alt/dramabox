import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const API_BASE = "/api/pinedrama";

export interface PineDramaDrama {
  bookId: string;
  bookName: string;
  cover: string;
  introduction: string;
  tagNames: string[];
  num_videos: number;
  num_watched: number;
  is_limited_free: boolean;
}

export interface PineDramaHomeResponse {
  success: boolean;
  data: PineDramaDrama[];
  has_more?: boolean;
  banner?: any;
  next_cursor?: string;
}

export function usePineDramaHomepage() {
  return useQuery({
    queryKey: ["pinedrama", "homepage"],
    queryFn: () => fetchJson<PineDramaHomeResponse>(`${API_BASE}/homepage`),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export interface PineDramaEpisode {
  serial_number: number;
  chapter_id: string;
  chapter_title: string;
  is_free: boolean;
  has_purchased: boolean;
  seq_id: number;
}

export interface PineDramaDetailResponse {
  success: boolean;
  data: {
    bookId: string;
    title: string;
    cover: string;
    description: string;
    tags: string[];
    totalEpisodes: number;
    episodes: PineDramaEpisode[];
  };
}

export function usePineDramaDetail(bookId: string) {
  return useQuery({
    queryKey: ["pinedrama", "detail", bookId],
    queryFn: () => fetchJson<PineDramaDetailResponse>(`${API_BASE}/detail?book_id=${bookId}`),
    enabled: !!bookId,
    staleTime: 1000 * 60 * 10,
  });
}

export interface PineDramaStreamResponse {
  success: boolean;
  data: {
    url: string;
    type: string;
    is_m3u8: boolean;
  };
}

export function usePineDramaStream(bookId: string, chapterId: string, seqId: number = 0) {
  return useQuery({
    queryKey: ["pinedrama", "streaming", bookId, chapterId, seqId],
    queryFn: () => fetchJson<PineDramaStreamResponse>(`${API_BASE}/streaming?book_id=${bookId}&chapter_id=${chapterId}&seq_id=${seqId}`),
    enabled: !!bookId && !!chapterId,
    staleTime: 0, // Set to 0 to bypass cache during troubleshooting
  });
}
