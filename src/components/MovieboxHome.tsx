"use client";

import { useMovieboxHomepage, useMovieboxTrending } from "@/hooks/useMoviebox";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { Skeleton } from "@/components/ui/skeleton";

function MovieboxSectionSkeleton() {
    return (
        <section className="space-y-4">
            <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                        <div className="aspect-[2/3] rounded-xl bg-muted/30 animate-pulse mb-2" />
                        <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </section>
    );
}

export function MovieboxHome() {
    const {
        data: homepageData,
        isLoading: isLoadingHomepage,
        error: homepageError
    } = useMovieboxHomepage();

    const {
        data: trendingData,
        isLoading: isLoadingTrending,
    } = useMovieboxTrending();

    const error = homepageError;
    const isLoading = isLoadingHomepage || isLoadingTrending;

    if (error) {
        return (
            <UnifiedErrorDisplay
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <MovieboxSectionSkeleton />
                <MovieboxSectionSkeleton />
                <MovieboxSectionSkeleton />
            </div>
        );
    }

    // Extract operating list showing different categories
    const operations = homepageData?.operatingList?.filter(op => op.type !== "BANNER" && op.subjects?.length > 0) || [];
    const trendingItems = trendingData?.data?.items || [];

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Trending Section */}
            {trendingItems.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
                            Trending Now
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {trendingItems.slice(0, 16).map((item, index) => {
                            const coverUrl = item.cover?.url || item.image || "";
                            const title = item.title || item.name || "Unknown Title";
                            const targetId = item.subjectId || item.id;
                            const isMovie = item.subjectType === 1;

                            return (
                                <UnifiedMediaCard
                                    key={`trending-${targetId}`}
                                    title={title}
                                    cover={coverUrl}
                                    link={`/detail/moviebox/${targetId}`}
                                    episodes={item.duration ? Math.ceil(item.duration / 60) : undefined}
                                    topLeftBadge={isMovie ? {
                                        text: "MOVIE",
                                        color: "#3b82f6",
                                    } : {
                                        text: "SERIES",
                                        color: "#eab308",
                                    }}
                                    index={index}
                                />
                            );
                        })}
                    </div>
                </section>
            )}

            {operations.map((operation, opIndex) => (
                <section key={opIndex}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
                            {operation.title || "Moviebox Spotlight"}
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {operation.subjects.map((item, index) => {
                            const subject = item.subject || item;
                            const coverUrl = subject.cover?.url || item.image?.url;
                            const targetId = item.subjectId || subject.subjectId || item.id;

                            return (
                                <UnifiedMediaCard
                                    key={targetId}
                                    title={subject.title || item.title || "Unknown Title"}
                                    cover={coverUrl || ""}
                                    link={`/detail/moviebox/${targetId}`}
                                    episodes={subject.duration ? Math.ceil(subject.duration / 60) : undefined}
                                    topLeftBadge={subject.subjectType === 1 ? {
                                        text: "MOVIE",
                                        color: "#3b82f6",
                                    } : {
                                        text: "SERIES",
                                        color: "#eab308",
                                    }}
                                    index={index}
                                />
                            );
                        })}
                    </div>
                </section>
            ))}

            {!isLoading && operations.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    Tidak ada konten movie saat ini.
                </div>
            )}
        </div>
    );
}
