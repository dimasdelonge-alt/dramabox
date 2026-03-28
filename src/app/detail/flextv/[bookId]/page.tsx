
"use client";

import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import { useQuery } from "@tanstack/react-query";
import { Play, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { decryptData } from "@/lib/crypto";

interface FlexTVDetailData {
    success: boolean;
    data: {
        book_id: string;
        book_title: string;
        book_pic: string;
        description: string;
        chapter_count: number;
        tag?: string;
        chapter_base: Array<{
            chapter_id: string;
            serial_number: number;
            chapter_title: string;
            is_charge: boolean;
        }>;
    };
}

async function fetchFlexTVDetail(bookId: string): Promise<FlexTVDetailData> {
    const response = await fetch(`/api/flextv/detail?book_id=${bookId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch detail");
    }
    const json = await response.json();
    if (json.data && typeof json.data === "string") {
        return decryptData(json.data);
    }
    return json;
}

export default function FlexTVDetailPage() {
    const params = useParams<{ bookId: string }>();
    const bookId = params.bookId;
    const router = useRouter();

    const { data, isLoading, error } = useQuery({
        queryKey: ["flextv", "detail", bookId],
        queryFn: () => fetchFlexTVDetail(bookId || ""),
        enabled: !!bookId,
    });

    if (isLoading) {
        return <DetailSkeleton />;
    }

    if (error || !data?.success) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <UnifiedErrorDisplay
                    title="Drama tidak ditemukan"
                    message="Tidak dapat memuat detail drama. Silakan coba lagi atau kembali ke beranda."
                    onRetry={() => router.push('/')}
                    retryLabel="Kembali ke Beranda"
                />
            </div>
        );
    }

    const detail = data.data;

    return (
        <main className="min-h-screen pt-20">
            <div className="relative">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src={detail.book_pic}
                        alt=""
                        className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
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

                    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                        <div className="relative group">
                            <img
                                src={detail.book_pic}
                                alt={detail.book_title}
                                className="w-full max-w-[300px] mx-auto rounded-2xl shadow-2xl"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                <Link
                                    href={`/watch/flextv/${detail.book_id}`}
                                    className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Tonton Sekarang
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold font-display gradient-text mb-4">
                                    {detail.book_title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Play className="w-4 h-4" />
                                        <span>{detail.chapter_count} Episode</span>
                                    </div>
                                    {detail.tag && (
                                        <div className="px-2 py-0.5 rounded-full bg-muted text-[10px] uppercase font-bold tracking-wider">
                                            {detail.tag}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="glass rounded-xl p-4">
                                <h3 className="font-semibold text-foreground mb-2">Sinopsis</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {detail.description || "Tidak ada deskripsi."}
                                </p>
                            </div>

                            <Link
                                href={`/watch/flextv/${detail.book_id}`}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-primary-foreground transition-all hover:scale-105 shadow-lg"
                                style={{ background: "var(--gradient-primary)" }}
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Mulai Menonton
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function DetailSkeleton() {
    return (
        <main className="min-h-screen pt-24 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                    <Skeleton className="aspect-[2/3] w-full max-w-[300px] rounded-2xl" />
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
