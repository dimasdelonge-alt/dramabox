"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMovieboxDetail, useMovieboxStream } from "@/hooks/useMoviebox";
import { ChevronLeft, ChevronRight, List, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import SubtitleOverlay from "@/components/SubtitleOverlay";

export default function MovieboxWatchPage() {
    const params = useParams<{ urlId: string; season: string; episode: string }>();
    const router = useRouter();
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const subjectId = decodeURIComponent(params.urlId || "");
    const seasonStr = decodeURIComponent(params.season || "1");
    const episodeStr = decodeURIComponent(params.episode || "1");
    const seasonNum = parseInt(seasonStr, 10);
    const episodeNum = parseInt(episodeStr, 10);

    // Fetch moviebox details for navigation
    const { data: detailData, isLoading: isLoadingDetail } = useMovieboxDetail(subjectId);

    // Fetch stream data for current episode
    const { data: streamData, isLoading: isLoadingStream, error: streamError } = useMovieboxStream(subjectId, seasonNum, episodeNum);

    const subject = detailData?.subject;
    const isMovie = subject?.subjectType === 1;

    // Build the episodes array based on current season to support navigation
    const currentSeasonData = useMemo(() => {
        if (!detailData?.resource?.seasons) return null;
        return detailData.resource.seasons.find(s => s.se === seasonNum);
    }, [detailData, seasonNum]);

    const maxEp = currentSeasonData?.maxEp || 1;

    // All available quality sources sorted highest first
    const allSources = useMemo(() => {
        if (!streamData?.processedSources?.length) return [];
        return [...streamData.processedSources].sort((a, b) => b.quality - a.quality);
    }, [streamData]);

    // Default quality pick (720p -> 480p -> first available)
    const defaultQuality = useMemo(() => {
        if (!allSources.length) return null;
        const q720 = allSources.find(s => s.quality === 720);
        const q480 = allSources.find(s => s.quality === 480);
        return (q720 || q480 || allSources[0]).quality;
    }, [allSources]);

    // Active quality
    const activeQuality = selectedQuality ?? defaultQuality;

    // Active video source URL
    const videoSource = useMemo(() => {
        if (!allSources.length || !activeQuality) return null;
        const source = allSources.find(s => s.quality === activeQuality) || allSources[0];
        return source.directUrl;
    }, [allSources, activeQuality]);

    const subtitles = useMemo(() => {
        if (!streamData?.subtitles?.length) return [];
        console.log(`[Moviebox] Found ${streamData.subtitles.length} subtitles`);
        return streamData.subtitles;
    }, [streamData]);

    // Proxy subtitle URLs through our video proxy to avoid CORS
    const getProxiedSubUrl = (url: string) => {
        return `/api/proxy/video?url=${encodeURIComponent(url)}&referer=${encodeURIComponent('https://api.sansekai.my.id/')}`;
    };

    const activeSubtitleUrl = useMemo(() => {
        if (!subtitles.length) return null;
        // Auto select Indonesian, then English, then first available
        const idSub = subtitles.find(s => s.lan === "in_id" || s.lan === "id");
        const enSub = subtitles.find(s => s.lan === "en_us" || s.lan === "en" || s.lan === "en_gb");
        const sub = idSub || enSub || subtitles[0];
        console.log(`[Moviebox] Selected ${sub.lanName} subtitle: ${sub.url}`);
        return getProxiedSubUrl(sub.url);
    }, [subtitles]);

    // Change quality while preserving playback position
    const handleQualityChange = useCallback((quality: number) => {
        const video = videoRef.current;
        const currentTime = video?.currentTime || 0;
        const wasPlaying = video ? !video.paused : false;

        setSelectedQuality(quality);
        setShowQualityMenu(false);

        // After React re-renders with new source, restore position
        setTimeout(() => {
            const v = videoRef.current;
            if (v) {
                v.currentTime = currentTime;
                if (wasPlaying) {
                    v.play().catch(() => { });
                }
            }
        }, 100);
    }, []);

    const handleEpisodeChange = (newEpisode: number) => {
        router.push(`/watch/moviebox/${params.urlId}/${seasonNum}/${newEpisode}`);
        setShowEpisodeList(false);
        setSelectedQuality(null); // Reset quality on episode change
    };

    const handleNextEpisode = () => {
        if (episodeNum < maxEp) {
            handleEpisodeChange(episodeNum + 1);
        }
    };

    const handlePrevEpisode = () => {
        if (episodeNum > 1) {
            handleEpisodeChange(episodeNum - 1);
        }
    };

    const hasNext = episodeNum < maxEp && !isMovie;
    const hasPrev = episodeNum > 1 && !isMovie;

    // Format file size
    const formatSize = (bytes: string) => {
        const num = parseInt(bytes, 10);
        if (isNaN(num)) return "";
        if (num > 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} GB`;
        if (num > 1_000_000) return `${(num / 1_000_000).toFixed(0)} MB`;
        return `${(num / 1_000).toFixed(0)} KB`;
    };

    if (isLoadingDetail || isLoadingStream) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center text-white flex-col gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm text-white/50">Memuat Stream...</p>
            </div>
        );
    }

    if (!subject) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
                <UnifiedErrorDisplay
                    title="Movie/Series tidak ditemukan"
                    message="Maaf, tayangan ini tidak dapat ditemukan."
                    onRetry={() => router.back()}
                    retryLabel="Kembali"
                />
            </div>
        );
    }

    return (
        <main className="fixed inset-0 bg-black flex flex-col">
            {/* Header Overlay */}
            <div className={`absolute top-0 left-0 right-0 z-30 h-16 transition-opacity duration-300 ${isPlaying && !showEpisodeList && !showQualityMenu ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
                    <Link
                        href={`/detail/moviebox/${params.urlId}`}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">Kembali</span>
                    </Link>

                    <div className="text-center flex-1 px-4 min-w-0">
                        <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
                            {subject.title || "Unknown Title"}
                        </h1>
                        {!isMovie && (
                            <p className="text-white/80 text-xs drop-shadow-md flex items-center justify-center gap-2">
                                Season {seasonNum} Episode {episodeNum}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Quality button */}
                        {allSources.length > 1 && (
                            <button
                                onClick={() => { setShowQualityMenu(!showQualityMenu); setShowEpisodeList(false); }}
                                className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10 relative"
                                title="Resolusi"
                            >
                                <Settings className="w-5 h-5 drop-shadow-md" />
                                <span className="absolute -bottom-0.5 -right-0.5 text-[9px] bg-primary text-white rounded px-0.5 font-bold leading-tight">
                                    {activeQuality}p
                                </span>
                            </button>
                        )}
                        {/* Episode list button */}
                        {!isMovie && (
                            <button
                                onClick={() => { setShowEpisodeList(!showEpisodeList); setShowQualityMenu(false); }}
                                className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            >
                                <List className="w-6 h-6 drop-shadow-md" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Quality Selector Popup */}
            {showQualityMenu && (
                <>
                    <div
                        className="fixed inset-0 z-[55]"
                        onClick={() => setShowQualityMenu(false)}
                    />
                    <div className="absolute top-16 right-4 z-[56] bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2.5 border-b border-white/10">
                            <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Resolusi</h3>
                        </div>
                        <div className="py-1">
                            {allSources.map((source) => (
                                <button
                                    key={source.id}
                                    onClick={() => handleQualityChange(source.quality)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left ${source.quality === activeQuality
                                        ? "bg-primary/20 text-primary"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{source.quality}p</span>
                                        {source.quality >= 1080 && (
                                            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">HD</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/40">{formatSize(source.size)}</span>
                                        {source.quality === activeQuality && (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Main Content: Native HTML5 Video Player */}
            <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center">
                {streamError || !videoSource ? (
                    <div className="text-center p-6 max-w-md">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">Stream Error</h3>
                        <p className="text-white/60 text-sm mb-6">Sumber video tidak ditemukan atau terjadi kesalahan.</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors">
                            Coba Lagi
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        key={`${videoSource}-${activeQuality}`}
                        src={videoSource}
                        controls
                        autoPlay
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        className="w-full h-full"
                        style={{
                            backgroundColor: "#000",
                            objectFit: "contain",
                        }}
                    >
                        {/* Native subtitle tracks as fallback */}
                        {subtitles.map((sub) => (
                            <track
                                key={sub.id}
                                kind="subtitles"
                                src={getProxiedSubUrl(sub.url)}
                                srcLang={sub.lan}
                                label={sub.lanName}
                                default={sub.lan === "in_id" || sub.lan === "id"}
                            />
                        ))}
                    </video>
                )}

                {/* Custom Subtitle Overlay */}
                {activeSubtitleUrl && (
                    <SubtitleOverlay url={activeSubtitleUrl} currentTime={currentTime} />
                )}
            </div>

            {/* Navigation Controls */}
            {!isMovie && (
                <div className={`absolute bottom-24 left-0 right-0 z-30 pointer-events-none flex justify-center pb-safe-area-bottom transition-opacity duration-300 ${isPlaying && !showEpisodeList ? 'opacity-0' : 'opacity-100'}`}>
                    <div className={`flex items-center gap-2 md:gap-6 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom ${!isPlaying || showEpisodeList ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                        <button
                            onClick={handlePrevEpisode}
                            disabled={!hasPrev}
                            className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                            title="Episode Sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                        </button>

                        <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
                            Ep {episodeNum}
                        </span>

                        <button
                            onClick={handleNextEpisode}
                            disabled={!hasNext}
                            className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                            title="Episode Selanjutnya"
                        >
                            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Episode List Sidebar */}
            {showEpisodeList && !isMovie && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        onClick={() => setShowEpisodeList(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-80 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
                        <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-white">Season {seasonNum}</h2>
                                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                                    Total {maxEp} Ep
                                </span>
                            </div>
                            <button
                                onClick={() => setShowEpisodeList(false)}
                                className="p-1 text-white/70 hover:text-white"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-3 grid grid-cols-4 gap-2">
                            {Array.from({ length: maxEp }).map((_, idx) => {
                                const epId = idx + 1;
                                return (
                                    <button
                                        key={epId}
                                        onClick={() => handleEpisodeChange(epId)}
                                        className={`
                                            py-2 rounded-lg text-xs font-medium transition-all relative overflow-hidden
                                            ${epId === episodeNum
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                            }
                                        `}
                                    >
                                        {epId}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
