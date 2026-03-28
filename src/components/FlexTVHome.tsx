
"use client";

import { useMemo } from "react";
import { useFlexTVHomepage } from "@/hooks/useFlexTV";
import { BannerCarousel } from "./BannerCarousel";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";

export function FlexTVHome() {
    const { data, isLoading, error, refetch } = useFlexTVHomepage();

    const sections = useMemo(() => {
        if (!data?.data?.lists) return { banners: [], bookGroups: [] };

        const banners: any[] = [];
        const bookGroups: { title: string; books: any[] }[] = [];

        data.data.lists.forEach((list) => {
            if (list.banners && list.banners.length > 0) {
                banners.push(...list.banners);
            }
            if (list.books && list.books.length > 0) {
                bookGroups.push({ title: list.title, books: list.books });
            }
        });

        return { banners, bookGroups };
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

    if (isLoading) {
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
        <div className="space-y-8">
            {/* Banner Carousel */}
            {banners.length > 0 && <BannerCarousel banners={banners} platform="flextv" />}

            {/* Book Sections */}
            {bookGroups.map((group, index) => (
                <section key={index}>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
                        {group.title}
                    </h2>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                        {group.books
                            .filter((book) => book.book_id && book.book_pic)
                            .map((book) => (
                                <UnifiedMediaCard
                                    key={book.book_id}
                                    index={index}
                                    title={book.book_title}
                                    cover={book.book_pic}
                                    link={`/detail/flextv/${book.book_id}`}
                                    episodes={book.chapter_count}
                                />
                            ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
