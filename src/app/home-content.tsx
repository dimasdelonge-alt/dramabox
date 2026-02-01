"use client";

import { PlatformSelector } from "@/components/PlatformSelector";
import { DramaSection } from "@/components/DramaSection";
import { ReelShortSection } from "@/components/ReelShortSection";
import { NetShortHome } from "@/components/NetShortHome";
import { MeloloHome } from "@/components/MeloloHome";
import { FlickReelsHome } from "@/components/FlickReelsHome";
import { FreeReelsHome } from "@/components/FreeReelsHome";
import { useForYouDramas, useLatestDramas, useTrendingDramas, useDubindoDramas } from "@/hooks/useDramas";
import { usePlatform } from "@/hooks/usePlatform";

export default function HomeContent() {
  const { isDramaBox, isReelShort, isNetShort, isMelolo, isFlickReels, isFreeReels } = usePlatform();

  // Fetch data for all DramaBox sections
  const { data: popularDramas, isLoading: loadingPopular, error: errorPopular, refetch: refetchPopular } = useForYouDramas();
  const { data: latestDramas, isLoading: loadingLatest, error: errorLatest, refetch: refetchLatest } = useLatestDramas();
  const { data: trendingDramas, isLoading: loadingTrending, error: errorTrending, refetch: refetchTrending } = useTrendingDramas();
  const { data: dubindoDramas, isLoading: loadingDubindo, error: errorDubindo, refetch: refetchDubindo } = useDubindoDramas();

  return (
    <main className="min-h-screen pt-16">
      {/* Platform Selector */}
      <div className="glass-strong sticky top-16 z-40">
        <div className="container mx-auto">
          <PlatformSelector />
        </div>
      </div>

      {/* DramaBox Content - Multiple Sections */}
      {isDramaBox && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <DramaSection
            title="Populer"
            dramas={popularDramas}
            isLoading={loadingPopular}
            error={!!errorPopular}
            onRetry={() => refetchPopular()}
          />
          <DramaSection
            title="Terbaru"
            dramas={latestDramas}
            isLoading={loadingLatest}
            error={!!errorLatest}
            onRetry={() => refetchLatest()}
          />
          <DramaSection
            title="Terpopuler"
            dramas={trendingDramas}
            isLoading={loadingTrending}
            error={!!errorTrending}
            onRetry={() => refetchTrending()}
          />
          <DramaSection
            title="Dubindo"
            dramas={dubindoDramas}
            isLoading={loadingDubindo}
            error={!!errorDubindo}
            onRetry={() => refetchDubindo()}
          />
        </div>
      )}

      {/* ReelShort Content - Multiple Sections */}
      {isReelShort && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <ReelShortSection />
        </div>
      )}

      {/* NetShort Content */}
      {isNetShort && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <NetShortHome />
        </div>
      )}

      {/* Melolo Content */}
      {isMelolo && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <MeloloHome />
        </div>
      )}

      {/* FlickReels Content */}
      {isFlickReels && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <FlickReelsHome />
        </div>
      )}

      {/* FreeReels Content */}
      {isFreeReels && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <FreeReelsHome />
        </div>
      )}
    </main>
  );
}

