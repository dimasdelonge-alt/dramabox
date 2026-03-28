
"use client";

import { useMemo, useEffect, useRef } from "react";
import { useInfiniteFlexTVHomepage } from "@/hooks/useFlexTV";
import { BannerCarousel } from "./BannerCarousel";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { Loader2 } from "lucide-react";

export function FlexTVHome() {
    const { 
        data, 
        isLoading, 
        error, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        refetch 
    } = useInfiniteFlexTVHomepage();

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

    const sections = useMemo(() => {
        if (!data?.pages) return { banners: [], bookGroups: [] };

        const banners: any[] = [];
        const bookGroupsMap = new Map<string, { title: string; books: any[] }>();

        data.pages.forEach((page) => {
            if (!page.success || !page.data.lists) return;

            page.data.lists.forEach((list) => {
                // Add banners only from first page
                if (list.banners && list.banners.length > 0 && banners.length === 0) {
                    banners.push(...list.banners);
                }

                if (list.books && list.books.length > 0) {
                    const existing = bookGroupsMap.get(list.title);
                    if (existing) {
                        // Deduplicate books by book_id to avoid repeats on pagination boundaries
                        const seenIds = new Set(existing.books.map(b => b.book_id));
                        const newBooks = list.books.filter(b => !seenIds.has(b.book_id));
                        existing.books.push(...newBooks);
                    } else {
                        bookGroupsMap.set(list.title, { title: list.title, books: [...list.books] });
                    }
                }
            });
        });

        return { banners, bookGroups: Array.from(bookGroupsMap.values()) };
    }, [data]);

    if (error) {
        return (
            <UnifiedErrorDisplay
                title="Gagal Memuat FlexTV"
                message="Terjadi kesalahan saat mengambil data dari server."
                onRetry={() => refetch()}
            />
        );
    }

    if (isLoading && !data) {
        return (
            <div className="space-y-8">
                <div className="aspect-[21/9] rounded-2xl bg-muted/50 animate-pulse" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-4" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i}>
                                    <div className="aspect-[2/3] rounded-lg bg-muted/50 animate-pulse" />
                                    <div className="mt-1.5 h-3 bg-muted/50 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const { banners, bookGroups } = sections;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Banner Carousel */}
            {banners.length > 0 && <BannerCarousel banners={banners} platform="flextv" />}

            {/* Book Sections */}
            {bookGroups.map((group, sectionIndex) => (
                <section key={sectionIndex}>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
                        {group.title}
                    </h2>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {group.books
                            .filter((book) => book.book_id && book.book_pic)
                            .map((book) => (
                                <UnifiedMediaCard
                                    key={book.book_id}
                                    index={sectionIndex}
                                    title={book.book_title}
                                    cover={book.book_pic}
                                    link={`/detail/flextv/${book.book_id}`}
                                    episodes={book.chapter_count}
                                />
                            ))}
                    </div>
                </section>
            ))}

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
                {isFetchingNextPage ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : hasNextPage ? (
                    <div className="h-4" />
                ) : bookGroups.length > 0 ? (
                    <p className="text-muted-foreground text-sm">Sudah mencapai akhir daftar</p>
                ) : null}
            </div>
        </div>
    );
}
