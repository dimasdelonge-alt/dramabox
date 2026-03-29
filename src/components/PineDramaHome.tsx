"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { fetchJson } from "@/lib/fetcher";
import { useEffect, useRef, useCallback } from "react";
import type { PineDramaHomeResponse } from "@/hooks/usePineDrama";

const API_BASE = "/api/pinedrama";

export function PineDramaHome() {
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["pinedrama", "homepage"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `${API_BASE}/homepage?cursor=${pageParam}&count=20`
        : `${API_BASE}/homepage?count=20`;
      return fetchJson<PineDramaHomeResponse>(url);
    },
    initialPageParam: "" as string,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    staleTime: 1000 * 60 * 5,
  });

  // Flatten all pages into a single drama list
  const allDramas = data?.pages.flatMap(page =>
    (page.data || []).map(d => ({
      ...d,
      introduction: `${d.num_videos} Episode • ${new Intl.NumberFormat('id-ID').format(d.num_watched)} Views`
    }))
  ) || [];

  // Deduplicate by bookId
  const dramas = Array.from(
    new Map(allDramas.map(d => [d.bookId, d])).values()
  );

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (error && !data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <UnifiedErrorDisplay
          title="Gagal Memuat PineDrama"
          message="Tidak dapat mengambil data drama."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
        Untukmu
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {dramas.map((drama, index) => (
              <UnifiedMediaCard
                key={drama.bookId || `drama-${index}`}
                index={index}
                title={drama.bookName}
                cover={drama.cover || ""}
                link={`/detail/pinedrama/${drama.bookId}`}
                episodes={drama.num_videos}
              />
            ))}

            {/* Loading skeletons while fetching next page */}
            {isFetchingNextPage &&
              Array.from({ length: 8 }).map((_, i) => (
                <UnifiedMediaCardSkeleton key={`loading-${i}`} />
              ))
            }
          </div>

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="h-4" />
        </>
      )}
    </div>
  );
}
