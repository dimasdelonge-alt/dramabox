"use client";

import { useEffect, useRef } from "react";
import { useInfiniteReelLifeHome, useReelLifeTrending } from "@/hooks/useReelLife";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { Loader2 } from "lucide-react";

export function ReelLifeHome() {
    // Trending (static, one-time fetch)
    const { data: trendingData, isLoading: loadingTrending } = useReelLifeTrending();

    // Infinite scroll for recommendations
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingHome,
        isError,
        refetch,
    } = useInfiniteReelLifeHome();

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Flatten pages into a single array
    const allDramas = data?.pages.flatMap((page) => page) || [];

    // Healing logic for trending
    const trendingRecords = Array.isArray(trendingData) ? trendingData : [];

    if (isError) {
        return (
            <section>
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">ReelLife</h2>
                <UnifiedErrorDisplay
                    title="Gagal Memuat ReelLife"
                    message="Tidak dapat mengambil data drama."
                    onRetry={() => refetch()}
                />
            </section>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Trending Section */}
            {(loadingTrending || trendingRecords.length > 0) && (
                <section>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
                        Trending di ReelLife
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {loadingTrending ? (
                            Array.from({ length: 8 }).map((_, i) => <UnifiedMediaCardSkeleton key={i} />)
                        ) : (
                            trendingRecords.slice(0, 16).map((drama: any, index: number) => (
                                <UnifiedMediaCard
                                    key={drama.bookId}
                                    index={index}
                                    title={drama.bookName}
                                    cover={drama.cover || ""}
                                    link={`/watch/reellife/${drama.bookId}`}
                                    episodes={drama.chapterCount}
                                    topLeftBadge={drama.corner ? { text: drama.corner.name, color: drama.corner.color } : null}
                                />
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Infinite Scroll Recommendations */}
            <section>
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
                    Lainnya
                </h2>

                {loadingHome ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <UnifiedMediaCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {allDramas.map((drama: any, index: number) => (
                            <UnifiedMediaCard
                                key={`${drama.bookId}-${index}`}
                                index={index}
                                title={drama.bookName}
                                cover={drama.cover || ""}
                                link={`/watch/reellife/${drama.bookId}`}
                                episodes={drama.chapterCount}
                                topLeftBadge={drama.corner ? { text: drama.corner.name, color: drama.corner.color } : null}
                            />
                        ))}
                    </div>
                )}

                {/* Loading Indicator & Trigger */}
                <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
                    {isFetchingNextPage ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : hasNextPage ? (
                        <div className="h-4" />
                    ) : allDramas.length > 0 ? (
                        <p className="text-muted-foreground text-sm">Sudah mencapai akhir daftar</p>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
