
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const API_BASE = "/api/flextv";

export interface FlexTVHomepageResponse {
    success: boolean;
    data: {
        tab_list: Array<{ tab_id: number; tab_name: string }>;
        lists: Array<{
            tab_id: number;
            title: string;
            books: any[];
            banners: any[];
        }>;
    };
}

export function useFlexTVHomepage() {
    return useQuery({
        queryKey: ["flextv", "homepage"],
        queryFn: () => fetchJson<FlexTVHomepageResponse>(`${API_BASE}/homepage`),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useInfiniteFlexTVHomepage() {
    return useInfiniteQuery({
        queryKey: ["flextv", "homepage", "infinite"],
        queryFn: ({ pageParam = 1 }) => 
            fetchJson<FlexTVHomepageResponse>(`${API_BASE}/homepage?page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.success || !lastPage.data.lists || lastPage.data.lists.every(l => l.books.length === 0)) {
                return undefined;
            }
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useFlexTVSearch(query: string) {
    const normalizedQuery = query.trim();

    return useQuery({
        queryKey: ["flextv", "search", normalizedQuery],
        queryFn: async () => {
            if (!normalizedQuery) return { success: true, data: [] };
            return fetchJson<any>(`${API_BASE}/search?keywords=${encodeURIComponent(normalizedQuery)}`);
        },
        enabled: normalizedQuery.length > 0,
        staleTime: 1000 * 60 * 2,
    });
}
