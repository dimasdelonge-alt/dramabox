"use client";

import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import { useMovieboxDetail } from "@/hooks/useMoviebox";
import { Play, ChevronLeft, Calendar, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function MovieboxDetailPage() {
    const params = useParams<{ urlId: string }>();
    const router = useRouter();
    const { data: detailData, isLoading, error } = useMovieboxDetail(params.urlId || "");

    if (isLoading) {
        return <DetailSkeleton />;
    }

    if (error || !detailData?.subject) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <UnifiedErrorDisplay
                    title="Movie tidak ditemukan"
                    message="Tidak dapat memuat detail movie. Silakan coba lagi."
                    onRetry={() => router.push('/')}
                    retryLabel="Kembali ke Beranda"
                />
            </div>
        );
    }

    const { subject, resource } = detailData;
    const title = subject.title || "Unknown Title";
    // We cast to any because thumbnail may exist in the API but wasn't typed in the hook interface
    const coverUrl = subject.cover?.url || (subject as any).thumbnail || "";
    const isMovie = subject.subjectType === 1;

    // Build the episodes list
    const seasons = resource?.seasons || [];

    // For movies, we just need to play season 1 episode 1 (or whatever defaults)
    const firstPlayLink = `/watch/moviebox/${params.urlId}/1/1`;

    return (
        <main className="min-h-screen pt-20 pb-12">
            {/* Hero Section */}
            <div className="relative">
                {/* Background Blur */}
                <div className="absolute inset-0 overflow-hidden h-[500px]">
                    <img
                        src={coverUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Kembali</span>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                        <div className="relative group mx-auto md:mx-0">
                            <img
                                src={coverUrl}
                                alt={title}
                                className="w-full max-w-[280px] rounded-2xl shadow-2xl"
                                referrerPolicy="no-referrer"
                            />
                            {isMovie && (
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                    <Link
                                        href={firstPlayLink}
                                        className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Tonton Sekarang
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold font-display gradient-text mb-4">
                                    {title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                                    {isMovie ? (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>{Math.ceil(subject.duration / 60)} Menit</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <Play className="w-4 h-4" />
                                            <span>{seasons.length} Season</span>
                                        </div>
                                    )}
                                    {subject.imdbRatingValue && (
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-semibold">{subject.imdbRatingValue}</span>
                                        </div>
                                    )}
                                    {subject.countryName && (
                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground">
                                            {subject.countryName}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isMovie ? "bg-blue-500/20 text-blue-500 border border-blue-500/20" : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"}`}>
                                        {isMovie ? "MOVIE" : "SERIES"}
                                    </span>
                                </div>

                                {subject.genre && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {subject.genre.split(',').map((g, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                {g.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="glass rounded-xl p-4">
                                <h3 className="font-semibold text-foreground mb-2">Sinopsis</h3>
                                <div className="text-muted-foreground leading-relaxed text-sm">
                                    {subject.description || "Tidak ada sinopsis."}
                                </div>
                            </div>

                            {/* Extra Info */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                {subject.releaseDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span>{subject.releaseDate}</span>
                                    </div>
                                )}
                            </div>

                            {/* Watch Button (Mobile/Movie) */}
                            {isMovie && (
                                <Link
                                    href={firstPlayLink}
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-primary-foreground transition-all hover:scale-105 shadow-lg mt-4 w-fit"
                                    style={{ background: "var(--gradient-primary)" }}
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Mulai Menonton
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Episode List (For Series) */}
            {!isMovie && seasons.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-12 space-y-8">
                    {seasons.map((season) => (
                        <div key={season.se} className="space-y-4">
                            <h2 className="text-2xl font-bold font-display">Season {season.se}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {Array.from({ length: season.maxEp }).map((_, idx) => {
                                    const epNum = idx + 1;
                                    return (
                                        <Link
                                            key={epNum}
                                            href={`/watch/moviebox/${params.urlId}/${season.se}/${epNum}`}
                                            className="group flex items-center justify-between p-4 rounded-xl bg-card hover:bg-muted transition-all border border-transparent hover:border-primary/20"
                                        >
                                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                Episode {epNum}
                                            </span>
                                            <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isMovie && seasons.length === 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-12">
                    <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl">
                        Belum ada episode tersedia.
                    </div>
                </div>
            )}
        </main>
    );
}

function DetailSkeleton() {
    return (
        <main className="min-h-screen pt-24 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                    <Skeleton className="aspect-[2/3] w-full max-w-[280px] rounded-2xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-12 w-48 rounded-full" />
                    </div>
                </div>
            </div>
        </main>
    );
}
