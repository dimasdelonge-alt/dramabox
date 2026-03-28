
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { decryptData } from "@/lib/crypto";

interface VideoItem {
    url: string;
    quality: number;
    definition: string;
    is_h265: boolean;
}

interface EpisodeData {
    success: boolean;
    is_locked: boolean;
    video_list: VideoItem[];
}

interface ChapterBase {
    chapter_id: string;
    serial_number: number;
    chapter_title: string;
    is_charge: boolean;
}

interface DetailData {
    success: boolean;
    data: {
        book_id: string;
        book_title: string;
        book_pic: string;
        chapter_count: number;
        chapter_base: ChapterBase[];
    };
}

async function fetchFlexTVEpisode(bookId: string, serialNumber: number): Promise<EpisodeData> {
    const response = await fetch(`/api/flextv/streaming?book_id=${bookId}&serial_number=${serialNumber}`);
    if (!response.ok) {
        throw new Error("Failed to fetch episode");
    }
    const json = await response.json();
    if (json.data && typeof json.data === "string") {
        return decryptData(json.data);
    }
    return json;
}

async function fetchFlexTVDetail(bookId: string): Promise<DetailData> {
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

export default function FlexTVWatchPage() {
    const params = useParams<{ bookId: string }>();
    const searchParams = useSearchParams();
    const bookId = params.bookId;
    const router = useRouter();

    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState<string>("auto");
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const ep = searchParams.get("ep");
        if (ep) {
            setCurrentEpisode(parseInt(ep) || 1);
        }
    }, [searchParams]);

    const { data: detailDataRes } = useQuery({
        queryKey: ["flextv", "detail", bookId],
        queryFn: () => fetchFlexTVDetail(bookId || ""),
        enabled: !!bookId,
    });

    const detailData = detailDataRes?.data;

    const { data: episodeData, isLoading, error } = useQuery({
        queryKey: ["flextv", "episode", bookId, currentEpisode],
        queryFn: async () => {
            const chapters = detailData?.chapter_base || [];
            // Many FlexTV dramas have chapters indexed starting from 1
            const chapter = chapters.find(c => c.serial_number === currentEpisode) || chapters[currentEpisode - 1];
            if (!chapter && chapters.length > 0) {
                throw new Error("Episode not found in list");
            }
            return fetchFlexTVEpisode(bookId || "", chapter?.serial_number || currentEpisode);
        },
        enabled: !!bookId && currentEpisode > 0 && !!detailData,
    });

    const qualityOptions = useMemo(() => {
        if (!episodeData?.video_list) return [];

        return episodeData.video_list.map((video, index) => ({
            id: `${video.definition}-${video.is_h265 ? 'h265' : 'h264'}-${index}`,
            label: `${video.definition} (${video.is_h265 ? 'H265' : 'H264'})`,
            video,
        }));
    }, [episodeData]);

    const getCurrentVideoUrl = useCallback(() => {
        if (!episodeData?.video_list?.length) return null;

        if (selectedQuality === "auto" || !qualityOptions.length) {
            // Default: prefer non-H265 for better browser compatibility if available
            const h264Video = episodeData.video_list.find(v => !v.is_h265);
            return h264Video || episodeData.video_list[0];
        }

        const selected = qualityOptions.find(q => q.id === selectedQuality);
        return selected?.video || episodeData.video_list[0];
    }, [episodeData, selectedQuality, qualityOptions]);

    const loadVideo = useCallback((videoUrl: string) => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        if (Hls.isSupported()) {
            if (hlsRef.current) hlsRef.current.destroy();
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => { });
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = videoUrl;
            video.play().catch(() => { });
        }
    }, []);

    useEffect(() => {
        const currentVideo = getCurrentVideoUrl();
        if (!currentVideo || !videoRef.current) return;
        loadVideo(currentVideo.url);

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [episodeData, selectedQuality, getCurrentVideoUrl, loadVideo]);

    const handleVideoEnded = useCallback(() => {
        const totalEpisodes = detailData?.chapter_count || 1;
        if (currentEpisode < totalEpisodes) {
            const nextEp = currentEpisode + 1;
            goToEpisode(nextEp);
        }
    }, [currentEpisode, detailData?.chapter_count, bookId]);

    const goToEpisode = (ep: number) => {
        setCurrentEpisode(ep);
        router.replace(`/watch/flextv/${bookId}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

    const totalEpisodes = detailData?.chapter_count || 1;

    return (
        <main className="fixed inset-0 bg-black flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
                    <Link
                        href={`/detail/flextv/${bookId}`}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">SekaiDrama</span>
                    </Link>

                    <div className="text-center flex-1 px-4 min-w-0">
                        <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
                            {detailData?.book_title || "Loading..."}
                        </h1>
                        <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                                    <Settings className="w-6 h-6 drop-shadow-md" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[100]">
                                <DropdownMenuItem onClick={() => setSelectedQuality("auto")} className={selectedQuality === "auto" ? "text-primary font-semibold" : ""}>
                                    Auto
                                </DropdownMenuItem>
                                {qualityOptions.map((option) => (
                                    <DropdownMenuItem key={option.id} onClick={() => setSelectedQuality(option.id)} className={selectedQuality === option.id ? "text-primary font-semibold" : ""}>
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button onClick={() => setShowEpisodeList(!showEpisodeList)} className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                            <List className="w-6 h-6 drop-shadow-md" />
                        </button>
                    </div>
                </div>
            </div>

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
                            <button onClick={() => router.refresh()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Coba Lagi</button>
                        </div>
                    )}

                    {episodeData?.is_locked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center p-4 z-20">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                            <p className="text-white text-lg font-medium mb-4">Episode ini terkunci</p>
                            <Link href={`/detail/flextv/${bookId}`} className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors">Kembali ke Detail</Link>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain max-h-[100dvh]"
                        controls
                        playsInline
                        autoPlay
                        onEnded={handleVideoEnded}
                    />
                </div>

                <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom">
                    <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
                        <button onClick={() => currentEpisode > 1 && goToEpisode(currentEpisode - 1)} disabled={currentEpisode <= 1} className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                        </button>
                        <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">Ep {currentEpisode} / {totalEpisodes}</span>
                        <button onClick={() => currentEpisode < totalEpisodes && goToEpisode(currentEpisode + 1)} disabled={currentEpisode >= totalEpisodes} className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors">
                            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {showEpisodeList && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setShowEpisodeList(false)} />
                    <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
                        <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
                            <h2 className="font-bold text-white">Daftar Episode</h2>
                            <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white"><ChevronRight className="w-6 h-6" /></button>
                        </div>
                        <div className="p-3 grid grid-cols-5 gap-2">
                            {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((ep) => (
                                <button key={ep} onClick={() => goToEpisode(ep)} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${ep === currentEpisode ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}>{ep}</button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
