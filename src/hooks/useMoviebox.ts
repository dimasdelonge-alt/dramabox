"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// Moviebox Interfaces

export interface MovieboxItem {
    subjectId: string;
    subjectType: number;
    title: string;
    description: string;
    releaseDate: string;
    duration: number;
    genre: string;
    cover: {
        url: string;
        width: number;
        height: number;
    };
    countryName: string;
    imdbRatingValue: string;
    subtitles: string;
    // Additional fields occasionally returned in Trending and Homepage lists
    image?: string;
    name?: string;
    id?: string;
}

export interface MovieboxSubjectItem {
    id: string;
    title: string;
    image?: { url: string };
    url: string;
    subjectId: string;
    subjectType: number;
    subject: MovieboxItem;
    detailPath?: string;
}

export interface MovieboxOperation {
    type: string;
    position: number;
    title: string;
    subjects: MovieboxSubjectItem[];
    banner?: { items: MovieboxSubjectItem[] };
}

export interface MovieboxHomepageResponse {
    topPickList: any[];
    homeList: any[];
    allPlatform: any[];
    platformList: { name: string; uploadBy: string }[];
    operatingList: MovieboxOperation[];
}

export interface MovieboxSearchResponse {
    items: MovieboxItem[];
    counts?: any[];
}

export interface MovieboxTrendingResponse {
    data?: {
        items: MovieboxItem[];
    };
}

export interface MovieboxSeason {
    se: number;
    maxEp: number;
    resolutions: { resolution: number; epNum: number }[];
}

export interface MovieboxDetailResponse {
    subject: MovieboxItem;
    stars: any[];
    resource: {
        seasons: MovieboxSeason[];
    };
}

export interface MovieboxSource {
    id: string;
    quality: number;
    directUrl: string;
    size: string;
    format: string;
}

export interface MovieboxSubtitle {
    id: string;
    lan: string;
    lanName: string;
    url: string;
}

export interface MovieboxStreamResponse {
    processedSources: MovieboxSource[];
    subtitles: MovieboxSubtitle[];
}

// Hooks

export function useMovieboxHomepage() {
    return useQuery<MovieboxHomepageResponse>({
        queryKey: ["moviebox", "homepage"],
        queryFn: () => fetchJson<MovieboxHomepageResponse>("/api/moviebox/homepage"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieboxSearch(query: string) {
    return useQuery<MovieboxSearchResponse>({
        queryKey: ["moviebox", "search", query],
        queryFn: () => fetchJson<MovieboxSearchResponse>(`/api/moviebox/search?query=${encodeURIComponent(query)}`),
        enabled: !!query,
    });
}

export function useMovieboxDetail(subjectId: string) {
    return useQuery<MovieboxDetailResponse>({
        queryKey: ["moviebox", "detail", subjectId],
        queryFn: () => fetchJson<MovieboxDetailResponse>(`/api/moviebox/detail?subjectId=${encodeURIComponent(subjectId)}`),
        enabled: !!subjectId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieboxStream(subjectId: string, season: string | number, episode: string | number) {
    return useQuery<MovieboxStreamResponse>({
        queryKey: ["moviebox", "stream", subjectId, season, episode],
        queryFn: () => fetchJson<MovieboxStreamResponse>(`/api/moviebox/watch?subjectId=${encodeURIComponent(subjectId)}&season=${encodeURIComponent(season)}&episode=${encodeURIComponent(episode)}`),
        enabled: !!subjectId && !!season && !!episode,
        retry: 1,
    });
}

export function useMovieboxTrending(page: number = 0) {
    return useQuery<MovieboxTrendingResponse>({
        queryKey: ["moviebox", "trending", page],
        queryFn: () => fetchJson<MovieboxTrendingResponse>(`/api/moviebox/trending?page=${page}`),
        staleTime: 5 * 60 * 1000,
    });
}
