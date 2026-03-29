"use client";

import { usePineDramaDetail, usePineDramaStream } from "@/hooks/usePineDrama";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export default function PineDramaWatch() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  // Get episode from URL
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep) {
      setCurrentEpisode(parseInt(ep) || 1);
    }
  }, [searchParams]);

  const { data: detailData } = usePineDramaDetail(bookId);

  const episodes = detailData?.data?.episodes || [];
  const totalEpisodes = detailData?.data?.totalEpisodes || episodes.length || 1;
  const dramaTitle = detailData?.data?.title || "Loading...";

  const currentEp = episodes.find(e => e.serial_number === currentEpisode);
  const videoId = currentEp?.chapter_id || "";
  const seqId = currentEp?.seq_id || 0;

  const { data: streamData, isLoading, error } = usePineDramaStream(bookId, videoId, seqId);

  const goToEpisode = useCallback((ep: number) => {
    setCurrentEpisode(ep);
    router.replace(`/watch/pinedrama/${bookId}?ep=${ep}`, { scroll: false });
    setShowEpisodeList(false);
  }, [bookId, router]);

  // Auto next episode on video end
  const handleVideoEnded = useCallback(() => {
    if (currentEpisode < totalEpisodes) {
      const nextEp = currentEpisode + 1;
      setCurrentEpisode(nextEp);
      window.history.replaceState(null, '', `/watch/pinedrama/${bookId}?ep=${nextEp}`);
    }
  }, [currentEpisode, totalEpisodes, bookId]);

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Header - Fixed Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/pinedrama/${bookId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-primary font-bold hidden sm:inline drop-shadow-md">SekaiDrama</span>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
              {dramaTitle}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode}</p>
          </div>

          {/* Episode List Toggle */}
          <button
            onClick={() => setShowEpisodeList(!showEpisodeList)}
            className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <List className="w-6 h-6 drop-shadow-md" />
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
              <AlertCircle className="w-10 h-10 text-destructive mb-4" />
              <p className="text-white mb-4">Gagal memuat video</p>
              <button
                onClick={() => router.refresh()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {currentEp && !currentEp.is_free && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center p-4 z-20">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Play className="w-10 h-10 text-black fill-black" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Episode Terkunci</h2>
              <p className="text-white/60 mb-8 max-w-xs">
                Episode ini memerlukan koin di TikTok asli.
              </p>
              <Link
                href={`/detail/pinedrama/${bookId}`}
                className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Kembali ke Detail
              </Link>
            </div>
          )}

          {/* Video Player */}
          <video
            key={videoId}
            src={streamData?.data?.url ? `/api/video-proxy?url=${encodeURIComponent(streamData.data.url)}` : undefined}
            className="w-full h-full object-contain max-h-[100dvh]"
            controls
            playsInline
            autoPlay
            onEnded={handleVideoEnded}
          />
        </div>

        {/* Navigation Controls Overlay - Bottom */}
        <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center">
          <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
            <button
              onClick={() => currentEpisode > 1 && goToEpisode(currentEpisode - 1)}
              disabled={currentEpisode <= 1}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>

            <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
              Ep {currentEpisode} / {totalEpisodes}
            </span>

            <button
              onClick={() => currentEpisode < totalEpisodes && goToEpisode(currentEpisode + 1)}
              disabled={currentEpisode >= totalEpisodes}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Episode List Sidebar - Matching ReelShort Design */}
      {showEpisodeList && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowEpisodeList(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white">Daftar Episode</h2>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                  Total {totalEpisodes}
                </span>
              </div>
              <button
                onClick={() => setShowEpisodeList(false)}
                className="p-1 text-white/70 hover:text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((ep) => (
                <button
                  key={ep}
                  onClick={() => goToEpisode(ep)}
                  className={`
                    aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all
                    ${ep === currentEpisode
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
