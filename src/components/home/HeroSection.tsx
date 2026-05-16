"use client";
// src/components/home/HeroSection.tsx
// Cinematic 65/35 hero — movie backdrop left, AI rating panel right.
// Auto-rotates every 10 seconds. Uses real TMDB backdrop_url when available.

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AIRatingPanel, { type MovieRatingData } from "./AIRatingPanel";
import { POSTER_BLUR_DATA, tmdbPosterUrl, tmdbBackdropUrl } from "@/lib/tmdb";
import type { MovieWithRating } from "@/types";

/* ── Types ────────────────────────────────────────────────── */
export interface HeroMovie extends MovieWithRating {
  ai_rating:          number;
  positive_sentiment: number;
  neutral_sentiment:  number;
  negative_sentiment: number;
  reactions_count:    number;
}

interface Props { movies: HeroMovie[] }

/* ── Helpers ──────────────────────────────────────────────── */
function buildRatingData(m: HeroMovie, rank: number): MovieRatingData {
  const r  = m.ai_rating ?? 0;
  const d  = { story:0, performances:0, direction:0, cinematography:0, music:0, entertainment:0 };
  // Derive individual metrics from the AI rating ± small variance
  const spread = [0.96, 1.04, 1.01, 0.99, 1.06, 1.03];
  const keys   = Object.keys(d) as (keyof typeof d)[];
  keys.forEach((k, i) => {
    d[k] = Math.min(10, Math.max(0, parseFloat((r * spread[i]).toFixed(1))));
  });
  const buzz: MovieRatingData["socialBuzz"] =
    r >= 9 ? "Very High" : r >= 8 ? "High" : r >= 7 ? "Medium" : "Low";
  return {
    rating:         r,
    verdict:        r >= 8.5 ? "MUST WATCH" : r >= 7.5 ? "RECOMMENDED" : r >= 6.5 ? "GOOD WATCH" : "AVERAGE",
    positive:       m.positive_sentiment ?? 80,
    neutral:        m.neutral_sentiment  ?? 12,
    negative:       m.negative_sentiment ?? 8,
    reactionsCount: m.reactions_count    ?? 0,
    metrics:        d,
    socialBuzz:     buzz,
    trendRank:      rank,
  };
}

function heroBadge(m: HeroMovie): string {
  if (m.release_type === "OTT") return `NOW ON ${(m.ott_platform ?? "OTT").toUpperCase()}`;
  const d = m.release_date ? new Date(m.release_date) : null;
  if (d && d > new Date()) return "COMING SOON";
  return "IN CINEMAS NOW";
}

/* ── Language-based gradient backgrounds ────────────────────── */
const LANG_GRADIENTS: Record<string, string> = {
  Telugu:    "linear-gradient(135deg,#0d0218 0%,#1a0535 40%,#0a0a12 100%)",
  Tamil:     "linear-gradient(135deg,#0a1a10 0%,#0c3a1a 40%,#0a0a12 100%)",
  Hindi:     "linear-gradient(135deg,#1a0808 0%,#3a0e0e 40%,#0a0a12 100%)",
  Malayalam: "linear-gradient(135deg,#08101a 0%,#0e2240 40%,#0a0a12 100%)",
  Kannada:   "linear-gradient(135deg,#160818 0%,#2e0a40 40%,#0a0a12 100%)",
  English:   "linear-gradient(135deg,#0a0a14 0%,#141428 40%,#0a0a12 100%)",
};

/* ── Component ───────────────────────────────────────────────── */
export default function HeroSection({ movies }: Props) {
  const [idx,           setIdx]           = useState(0);
  const [fading,        setFading]        = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((next: number) => {
    if (next === idx) return;
    setFading(true);
    setTimeout(() => { setIdx(next); setFading(false); }, 350);
  }, [idx]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx(prev => (prev + 1) % movies.length);
    }, 10_000);
  }, [movies.length]);

  useEffect(() => { resetTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [resetTimer]);

  function handleDot(i: number) { goTo(i); resetTimer(); }

  if (!movies.length) return null;

  const movie      = movies[idx];
  const ratingData = buildRatingData(movie, idx + 1);
  const bgGradient = LANG_GRADIENTS[movie.language] ?? LANG_GRADIENTS["English"];
  const runtime    = movie.runtime_minutes
    ? `${Math.floor(movie.runtime_minutes / 60)}h ${movie.runtime_minutes % 60}m`
    : null;

  return (
    <>
      <section
        className="relative w-full h-[85vh] bg-cover bg-center"
        style={{
          backgroundImage: "url('/movies/pushpa2.jpg')",
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Content */}
        <div className="relative z-10 flex items-center h-full max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">

            <span className="bg-red-600 text-white px-3 py-1 text-sm rounded">
              IN CINEMAS NOW
            </span>

            <h1 className="text-6xl font-bold text-white mt-4">
              Pushpa 2: The Rule
            </h1>

            <p className="text-gray-300 mt-4">
              Pushpa Raj rises higher and faces stronger enemies
              as he fights for power, loyalty and his empire.
            </p>

            <div className="flex gap-4 mt-6">
              <button className="bg-red-600 px-6 py-3 rounded text-white font-semibold">
                Watch Trailer
              </button>

              <button className="border border-gray-400 px-6 py-3 rounded text-white">
                Add to Watchlist
              </button>
            </div>

          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "65% 35%", height: "calc(100vh - 70px)", minHeight: "600px", maxHeight: "900px", overflow: "hidden" }}>

      {/* ── LEFT: Cinematic poster/backdrop ───────────────── */}
      <div style={{ position: "relative", overflow: "hidden", background: "#0a0a0f" }}>

        {/* Background layers — one per movie, crossfade */}
        {movies.map((m, i) => {
          const posterUrl = m.poster_url ? tmdbPosterUrl(m.poster_url) : null;
          const backdropUrl = m.backdrop_url ? tmdbBackdropUrl(m.backdrop_url) : null;

          return (
            <div
              key={m.id}
              style={{
                position:   "absolute",
                inset:      0,
                opacity:    i === idx ? 1 : 0,
                transition: "opacity 0.7s ease",
              }}
            >
              {backdropUrl ? (
                <Image
                  src={backdropUrl}
                  alt={m.title}
                  fill
                  sizes="65vw"
                  priority={i === 0}
                  placeholder="blur"
                  blurDataURL={POSTER_BLUR_DATA}
                  style={{ objectFit: "cover", objectPosition: "center top", transform: "scale(1.03)" }}
                />
              ) : posterUrl ? (
                <div style={{ position: "absolute", inset: 0, background: bgGradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: "280px", aspectRatio: "2/3", borderRadius: "16px", overflow: "hidden", opacity: 0.5 }}>
                    <Image src={posterUrl} alt={m.title} fill sizes="280px" style={{ objectFit: "cover" }} />
                  </div>
                </div>
              ) : (
                <div style={{ position: "absolute", inset: 0, background: bgGradient }} />
              )}
            </div>
          );
        })}

        {/* Gradient overlays */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.05) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,11,15,0.96) 0%, rgba(11,11,15,0.3) 45%, transparent 100%)", pointerEvents: "none" }} />

        {/* Content */}
        <div
          style={{
            position:   "relative",
            zIndex:     2,
            height:     "100%",
            display:    "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding:    "0 44px 48px",
            opacity:    fading ? 0 : 1,
            transform:  fading ? "translateY(6px)" : "translateY(0)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
        >
          {/* IN CINEMAS NOW badge */}
          <div style={{ marginBottom: "14px" }}>
            <span style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "6px",
              background:    "rgba(255,44,44,0.15)",
              border:        "1px solid rgba(255,44,44,0.45)",
              borderRadius:  "6px",
              padding:       "5px 12px",
              fontSize:      "11px",
              fontWeight:    700,
              color:         "#ff2c2c",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}>
              <span className="animate-blink-dot" style={{ width: "6px", height: "6px", background: "#ff2c2c", borderRadius: "50%", flexShrink: 0 }} />
              {heroBadge(movie)}
            </span>
          </div>

          {/* Genre tags + runtime */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {movie.genre?.slice(0, 3).map(g => (
              <span key={g} style={{
                background:    "rgba(255,255,255,0.1)",
                border:        "1px solid rgba(255,255,255,0.18)",
                borderRadius:  "5px",
                padding:       "4px 11px",
                fontSize:      "11px",
                fontWeight:    700,
                color:         "#fff",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                {g}
              </span>
            ))}
            {runtime && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {runtime}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily:  "'Bebas Neue', sans-serif",
            fontSize:    "clamp(44px, 6vw, 76px)",
            lineHeight:  0.95,
            letterSpacing: "1px",
            color:       "#fff",
            marginBottom: "12px",
          }}>
            {movie.title}
          </h1>

          {/* Description */}
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "520px", marginBottom: "24px", fontWeight: 400 }}>
            {movie.summary ?? "An epic cinematic experience. A masterclass in storytelling and visual grandeur."}
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            {/* Watch Trailer */}
            <Link
              href={`/movies/${movie.slug}`}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          "8px",
                background:   "#ff2c2c",
                color:        "#fff",
                padding:      "13px 26px",
                borderRadius: "10px",
                fontSize:     "14px",
                fontWeight:   700,
                textDecoration: "none",
                boxShadow:    "0 4px 24px rgba(255,44,44,0.4)",
                transition:   "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#e01e1e";
                (e.currentTarget as HTMLElement).style.transform  = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#ff2c2c";
                (e.currentTarget as HTMLElement).style.transform  = "translateY(0)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
              Watch Trailer
            </Link>

            {/* Add to Watchlist */}
            <button style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "8px",
              background:    "rgba(255,255,255,0.08)",
              border:        "1px solid rgba(255,255,255,0.18)",
              color:         "#fff",
              padding:       "13px 22px",
              borderRadius:  "10px",
              fontSize:      "14px",
              fontWeight:    600,
              cursor:        "pointer",
              fontFamily:    "'DM Sans', sans-serif",
              transition:    "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add to Watchlist
            </button>
          </div>

          {/* Rotation dots */}
          {movies.length > 1 && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {movies.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDot(i)}
                  style={{
                    height:       "5px",
                    width:        i === idx ? "26px" : "5px",
                    borderRadius: "3px",
                    background:   i === idx ? "#ffb400" : "rgba(255,255,255,0.25)",
                    border:       "none",
                    cursor:       "pointer",
                    padding:      0,
                    transition:   "all 0.3s",
                  }}
                  aria-label={`Go to movie ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: AI Rating Panel ─────────────────────────── */}
      <div style={{
        opacity:    fading ? 0 : 1,
        transition: "opacity 0.35s ease",
      }}>
        <AIRatingPanel data={ratingData} />
      </div>

    </section>
    </>
  );
}