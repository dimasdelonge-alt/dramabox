
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// Interfaces based on FlickReels JSON response

export interface FlickReelsPlaylet {
  playlet_id: number | string; // Can be 0 for section headers in ForYou?
  title: string;
  cover: string;
  upload_num?: string;
  hot_num?: string;
  playlet_tag_name?: string[];
  introduce?: string;
  rank_list?: FlickReelsPlaylet[]; // Nested list for rank sections
  rank_name?: string; // Section name if it's a rank container
  [key: string]: any;
}

export interface FlickReelsForYouResponse {
  status_code: number;
  msg: string;
  data: {
    list: FlickReelsPlaylet[];
    // other fields
  };
}

export interface FlickReelsLatestResponse {
  status_code: number;
  msg: string;
  data: {
    list: FlickReelsPlaylet[];
    title?: string;
  }[]; // 'data' is an array of sections, or checks shows 'data' -> array of objects with 'list'
}

export interface FlickReelsHotRankResponse {
  status_code: number;
  msg: string;
  data: {
    name: string;
    rank_type: number;
    data: FlickReelsPlaylet[];
  }[];
}

export interface FlickReelsSearchResponse {
  status_code: number;
  msg: string;
  data: FlickReelsPlaylet[];
}

export interface FlickReelsEpisode {
  id: string;
  name: string;
  index: number;
  unlock: boolean;
  raw: {
    chapter_id: string;
    chapter_num: number;
    is_lock: number;
    chapter_cover: string;
    introduce: string;
    chapter_title: string;
    videoUrl: string;
  };
}

export interface FlickReelsDetailResponse {
  drama: {
    title: string;
    cover: string;
    description: string;
    chapterCount: number;
    labels: any[];
    viewCount: number;
    source: string;
  };
  episodes: FlickReelsEpisode[];
}

export function useFlickReelsForYou() {
  return useQuery<FlickReelsForYouResponse>({
    queryKey: ["flickreels", "foryou"],
    queryFn: () => fetchJson<FlickReelsForYouResponse>("/api/flickreels/foryou"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFlickReelsLatest() {
  return useQuery<FlickReelsLatestResponse>({
    queryKey: ["flickreels", "latest"],
    queryFn: () => fetchJson<FlickReelsLatestResponse>("/api/flickreels/latest"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFlickReelsHotRank() {
  return useQuery<FlickReelsHotRankResponse>({
    queryKey: ["flickreels", "hotrank"],
    queryFn: () => fetchJson<FlickReelsHotRankResponse>("/api/flickreels/hotrank"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFlickReelsSearch(query: string) {
  return useQuery<FlickReelsSearchResponse>({
    queryKey: ["flickreels", "search", query],
    queryFn: () => fetchJson<FlickReelsSearchResponse>(`/api/flickreels/search?query=${encodeURIComponent(query)}`),
    enabled: !!query,
    staleTime: 60 * 1000,
  });
}

export function useFlickReelsDetail(bookId: string) {
  return useQuery<FlickReelsDetailResponse>({
    queryKey: ["flickreels", "detail", bookId],
    queryFn: () => fetchJson<FlickReelsDetailResponse>(`/api/flickreels/detail?id=${bookId}`),
    enabled: !!bookId,
    staleTime: 10 * 1000, // 10 seconds - video URLs have time-limited tokens
    gcTime: 30 * 1000, // Garbage collect after 30 seconds
  });
}
