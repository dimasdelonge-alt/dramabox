"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Play } from "lucide-react";
import { useSearchDramas } from "@/hooks/useDramas";
import { useReelShortSearch } from "@/hooks/useReelShort";
import { useNetShortSearch } from "@/hooks/useNetShort";
import { useMeloloSearch } from "@/hooks/useMelolo";
import { useFlickReelsSearch } from "@/hooks/useFlickReels";
import { useFreeReelsSearch } from "@/hooks/useFreeReels";
import { usePlatform } from "@/hooks/usePlatform";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const normalizedQuery = debouncedQuery.trim();

  // Platform context
  const { isDramaBox, isReelShort, isNetShort, isMelolo, isFlickReels, isFreeReels, platformInfo } = usePlatform();

  // Search based on platform
  const { data: dramaBoxResults, isLoading: isSearchingDramaBox } = useSearchDramas(
    isDramaBox ? normalizedQuery : ""
  );
  const { data: reelShortResults, isLoading: isSearchingReelShort } = useReelShortSearch(
    isReelShort ? normalizedQuery : ""
  );
  const { data: netShortResults, isLoading: isSearchingNetShort } = useNetShortSearch(
    isNetShort ? normalizedQuery : ""
  );
  const { data: meloloResults, isLoading: isSearchingMelolo } = useMeloloSearch(
    isMelolo ? normalizedQuery : ""
  );
  const { data: flickReelsResults, isLoading: isSearchingFlickReels } = useFlickReelsSearch(
    isFlickReels ? normalizedQuery : ""
  );
  const { data: freeReelsResults, isLoading: isSearchingFreeReels } = useFreeReelsSearch(
    isFreeReels ? normalizedQuery : ""
  );

  const isSearching = isDramaBox 
    ? isSearchingDramaBox 
    : isReelShort 
      ? isSearchingReelShort 
      : isNetShort 
        ? isSearchingNetShort
        : isMelolo
          ? isSearchingMelolo
          : isFlickReels
            ? isSearchingFlickReels
            : isSearchingFreeReels;

  // Search results processing
  const searchResults = isDramaBox 
    ? dramaBoxResults 
    : isReelShort 
      ? reelShortResults?.data 
      : isNetShort
        ? netShortResults?.data
        : isMelolo
          ? meloloResults?.data?.search_data?.flatMap((item: any) => item.books || [])
              .filter((book: any) => book.thumb_url && book.thumb_url !== "") || []
          : isFlickReels
            ? flickReelsResults?.data
            : freeReelsResults;

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Hide header on watch pages for immersive video experience
  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              SekaiDrama
            </span>
          </Link>

          {/* Search Button Only - No Nav Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay (Portal) */}
      {searchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-background z-[9999] overflow-hidden">
            <div className="container mx-auto px-4 py-6 h-[100dvh] flex flex-col">
              <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Cari drama di ${platformInfo.name}...`}
                    className="search-input pl-12"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearchClose}
                  className="p-3 rounded-xl hover:bg-muted/50 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform indicator */}
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mencari di:</span>
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  {platformInfo.name}
                </span>
              </div>

              {/* Search Results */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {isSearching && normalizedQuery && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* DramaBox Results */}
                {isDramaBox && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.bookId}
                        href={`/detail/dramabox/${drama.bookId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.bookName}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.bookName}</h3>
                          {drama.protagonist && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">{drama.protagonist}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {drama.introduction}
                          </p>
                          {drama.tagNames && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {drama.tagNames.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* ReelShort Results */}
                {isReelShort && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/reelshort/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={book.book_pic}
                          alt={book.book_title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.book_title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {book.special_desc}
                          </p>
                          {book.theme && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {book.theme.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {book.book_mark?.text && (
                            <span
                              className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                backgroundColor: book.book_mark.color || "#E52E2E",
                                color: book.book_mark.text_color || "#FFFFFF",
                              }}
                            >
                              {book.book_mark.text}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* NetShort Results */}
                {isNetShort && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.shortPlayId}
                        href={`/detail/netshort/${drama.shortPlayId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          {drama.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {drama.description}
                            </p>
                          )}
                          {drama.labels && drama.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {drama.labels.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {drama.heatScore && (
                            <span className="inline-block mt-2 text-[10px] text-muted-foreground">
                              {drama.heatScore}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Melolo Results */}
                {isMelolo && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/melolo/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-16 h-24 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                          {book.thumb_url ? (
                            <img
                              src={book.thumb_url.includes(".heic") 
                                ? `https://wsrv.nl/?url=${encodeURIComponent(book.thumb_url)}&output=jpg` 
                                : book.thumb_url}
                              alt={book.book_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <span className="text-xs text-muted-foreground">No Img</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.book_name}</h3>
                          {book.abstract && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {book.abstract}
                            </p>
                          )}
                          {book.stat_infos && book.stat_infos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                               <span className="tag-pill text-[10px]">
                                  {book.stat_infos[0]}
                               </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* FlickReels Results */}
                {isFlickReels && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.playlet_id}
                        href={`/detail/flickreels/${book.playlet_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.title}</h3>
                          {book.introduce && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {book.introduce}
                            </p>
                          )}
                          {book.tag_list && book.tag_list.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {book.tag_list.slice(0, 3).map((tag: any, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag.tag_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* FreeReels Results */}
                {isFreeReels && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.key}
                        href={`/detail/freereels/${book.key}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.title}</h3>
                          {book.desc && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {book.desc}
                            </p>
                          )}
                          {book.content_tags && book.content_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {book.content_tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults && searchResults.length === 0 && normalizedQuery && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Tidak ada hasil untuk "{normalizedQuery}" di {platformInfo.name}</p>
                  </div>
                )}

                {!normalizedQuery && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Ketik untuk mencari drama di {platformInfo.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
