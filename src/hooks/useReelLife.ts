"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";
import type { Drama } from "@/types/drama";

const API_BASE = "/api/reellife";

export function useReelLifeHome(page: number = 1) {
    return useQuery({
        queryKey: ["reellife", "home", page],
        queryFn: () => fetchJson<any>(`${API_BASE}/foryou?page=${page}`),
        staleTime: 1000 * 60 * 5,
    });
}

// Infinite scroll version
export function useInfiniteReelLifeHome() {
    return useInfiniteQuery({
        queryKey: ["reellife", "foryou", "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetchJson<any>(`${API_BASE}/foryou?page=${pageParam}`);
            // Handle both standardized and raw response
            if (Array.isArray(res)) return res;
            return res?.records || [];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any[], allPages: any[][]) => {
            if (!lastPage || lastPage.length === 0 || allPages.length >= 50) return undefined;
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useReelLifeTrending() {
    return useQuery({
        queryKey: ["reellife", "trending"],
        queryFn: () => fetchJson<any[]>(`${API_BASE}/trending`),
        staleTime: 1000 * 60 * 5,
    });
}

export function useReelLifeSearch(keyword: string, page: number = 1) {
    return useQuery({
        queryKey: ["reellife", "search", keyword, page],
        queryFn: () => fetchJson<any>(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`),
        enabled: keyword.length > 0,
        staleTime: 1000 * 60 * 2,
    });
}

export function useReelLifeDetail(bookId: string) {
    return useQuery({
        queryKey: ["reellife", "detail", bookId],
        queryFn: () => fetchJson<any>(`${API_BASE}/detail?book_id=${bookId}`),
        enabled: !!bookId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useReelLifeEpisodes(bookId: string) {
    return useQuery({
        queryKey: ["reellife", "episodes", bookId],
        queryFn: () => fetchJson<any[]>(`${API_BASE}/allepisode?book_id=${bookId}`),
        enabled: !!bookId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useReelLifeStream(bookId: string, chapterId: string) {
    return useQuery({
        queryKey: ["reellife", "stream", bookId, chapterId],
        queryFn: () => fetchJson<any>(`${API_BASE}/stream?book_id=${bookId}&chapter_id=${chapterId}`),
        enabled: !!bookId && !!chapterId,
        staleTime: 1000 * 60 * 1,
    });
}
