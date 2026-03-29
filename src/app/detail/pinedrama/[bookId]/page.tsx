"use client";

import { usePineDramaDetail } from "@/hooks/usePineDrama";
import Link from "next/link";
import { ChevronLeft, Play } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function PineDramaDetail() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const { data: detailData, isLoading, error } = usePineDramaDetail(bookId);

  if (isLoading) return <DetailSkeleton />;

  if (error || !detailData?.success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">Gagal memuat detail drama dari TikTok</p>
        <Link href="/" className="px-6 py-2 bg-primary rounded-full text-white">Kembali</Link>
      </div>
    );
  }

  const { title, cover, description, totalEpisodes } = detailData.data;

  return (
    <main className="min-h-screen pt-20">
      {/* Hero Section with Cover */}
      <div className="relative">
        {/* Background Blur */}
        <div className="absolute inset-0 overflow-hidden">
          {cover && (
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            {/* Cover */}
            <div className="relative group">
              {cover ? (
                <img
                  src={cover}
                  alt={title}
                  className="w-full max-w-[300px] mx-auto rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="w-full max-w-[300px] mx-auto aspect-[3/4] rounded-2xl bg-card flex items-center justify-center">
                  <Play className="w-16 h-16 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                <Link
                  href={`/watch/pinedrama/${bookId}`}
                  className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Tonton Sekarang
                </Link>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display gradient-text mb-4">
                  {title}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    <span>{totalEpisodes} Episode</span>
                  </div>
                </div>
              </div>

              {/* Description / Sinopsis */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2">Sinopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {description || "Tidak ada deskripsi."}
                </p>
              </div>

              {/* Watch Button */}
              <Link
                href={`/watch/pinedrama/${bookId}`}
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
          <Skeleton className="aspect-[3/4] w-full max-w-[300px] rounded-2xl" />
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
