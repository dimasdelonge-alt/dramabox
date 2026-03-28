"use client";

import { create } from "zustand";

export type Platform = "dramabox" | "reelshort" | "netshort" | "melolo" | "flickreels" | "freereels" | "shortmax" | "moviebox" | "reellife" | "flextv";

export interface PlatformInfo {
  id: Platform;
  name: string;
  logo: string;
  apiBase: string;
}

export const PLATFORMS: PlatformInfo[] = [
  {
    id: "dramabox",
    name: "DramaBox",
    logo: "/dramabox.webp",
    apiBase: "/api/dramabox",
  },
  {
    id: "reelshort",
    name: "ReelShort",
    logo: "/reelshort.webp",
    apiBase: "/api/reelshort",
  },
  {
    id: "netshort",
    name: "NetShort",
    logo: "/netshort.webp",
    apiBase: "/api/netshort",
  },
  {
    id: "melolo",
    name: "Melolo",
    logo: "/melolo.webp",
    apiBase: "/api/melolo",
  },
  {
    id: "flickreels",
    name: "FlickReels",
    logo: "/flickreels.png",
    apiBase: "/api/flickreels",
  },
  {
    id: "freereels",
    name: "FreeReels",
    logo: "/freereels.webp",
    apiBase: "/api/freereels",
  },
  {
    id: "shortmax",
    name: "ShortMax",
    logo: "/shortmax.jpg",
    apiBase: "/api/shortmax",
  },
  {
    id: "moviebox",
    name: "Moviebox",
    logo: "/anime.png", // Keep previous logo file or provide a new one
    apiBase: "/api/moviebox",
  },
  {
    id: "reellife",
    name: "ReelLife",
    logo: "/reellife.png",
    apiBase: "/api/reellife",
  },
  {
    id: "flextv",
    name: "FlexTV",
    logo: "/flextv.png",
    apiBase: "/api/flextv",
  },
];

interface PlatformState {
  currentPlatform: Platform;
  setPlatform: (platform: Platform) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  currentPlatform: "dramabox",
  setPlatform: (platform) => set({ currentPlatform: platform }),
}));

export function usePlatform() {
  const { currentPlatform, setPlatform } = usePlatformStore();
  const platformInfo = PLATFORMS.find((p) => p.id === currentPlatform)!;

  const getPlatformInfo = (platformId: Platform) => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
  };

  return {
    currentPlatform,
    platformInfo,
    setPlatform,
    platforms: PLATFORMS,
    getPlatformInfo,
    isDramaBox: currentPlatform === "dramabox",
    isReelShort: currentPlatform === "reelshort",
    isNetShort: currentPlatform === "netshort",
    isMelolo: currentPlatform === "melolo",
    isFlickReels: currentPlatform === "flickreels",
    isFreeReels: currentPlatform === "freereels",
    isShortMax: currentPlatform === "shortmax",
    isMoviebox: currentPlatform === "moviebox",
    isReelLife: currentPlatform === "reellife",
    isFlexTV: currentPlatform === "flextv",
  };
}
