"use client";
// src/components/movie/MoviePoster.tsx
//
// ─── HOW MOVIE POSTERS LOAD AUTOMATICALLY ─────────────────────
//
//  Step 1 — Agent 1 (runs every 6h via Trigger.dev cron):
//    const details = await axios.get(`https://api.themoviedb.org/3/movie/${tmdb_id}`)
//    poster_url = `https://image.tmdb.org/t/p/w500${details.poster_path}`
//    → saves poster_url to Supabase movies table
//
//  Step 2 — This component reads poster_url from Supabase via props:
//    <MoviePoster src={movie.poster_url} alt={movie.title} />
//
//  Step 3 — next/image handles the rest:
//    → lazy loading (loads only when scrolled into view)
//    → blur placeholder shown while loading
//    → WebP conversion (40% smaller file size)
//    → responsive sizes served automatically
//    → Vercel Edge Network caches it globally
//
//  You NEVER manually upload or add any image.
//  Every poster is 100% automatic from TMDB.
// ─────────────────────────────────────────────────────────────

import Image from "next/image";
import { cn } from "@/lib/utils";
import { posterGradient, posterEmoji, POSTER_BLUR_DATA } from "@/lib/tmdb";

interface MoviePosterProps {
  src:        string | null | undefined;
  alt:        string;
  language?:  string;
  sizes?:     string;
  priority?:  boolean;
  className?: string;
  overlay?:   "bottom" | "full" | "right" | "none";
}

export default function MoviePoster({
  src,
  alt,
  language   = "default",
  sizes      = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
  priority   = false,
  className,
  overlay    = "none",
}: MoviePosterProps) {

  const overlayGradients = {
    bottom: "linear-gradient(to top, rgba(11,11,15,0.92) 0%, rgba(11,11,15,0.4) 40%, transparent 100%)",
    full:   "linear-gradient(to top, rgba(11,11,15,1) 0%, rgba(11,11,15,0.6) 50%, rgba(11,11,15,0.2) 100%)",
    right:  "linear-gradient(to right, rgba(11,11,15,0.98) 0%, rgba(11,11,15,0.7) 50%, rgba(11,11,15,0.1) 100%)",
    none:   undefined,
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>

      {src ? (
        /* ── REAL TMDB POSTER ─────────────────────────────── */
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={POSTER_BLUR_DATA}
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        /* ── FALLBACK GRADIENT ────────────────────────────── */
        /* Only shows when Agent 1 hasn't processed this movie yet */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: posterGradient(language) }}
        >
          <span className="text-6xl opacity-50 select-none">{posterEmoji(language)}</span>
          <span className="text-xs text-white/25 font-semibold tracking-widest uppercase select-none">
            {language}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      {overlay !== "none" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: overlayGradients[overlay] }}
        />
      )}
    </div>
  );
}