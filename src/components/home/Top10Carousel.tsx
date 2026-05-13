"use client";
// src/components/home/Top10Carousel.tsx
// Horizontal drag-to-scroll carousel — matches CineAI Top 10 exactly.
// Gold rank badges, poster images, movie name, star rating below.

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { POSTER_BLUR_DATA, posterGradient, posterEmoji, tmdbPosterUrl } from "@/lib/tmdb";
import type { MovieWithRating } from "@/types";

interface Props { movies: MovieWithRating[] }

/* Rank badge colors */
function rankStyle(r: number): React.CSSProperties {
  if (r === 1) return { background: "#ffb400", color: "#000", boxShadow: "0 0 14px rgba(255,180,0,0.65)" };
  if (r === 2) return { background: "#c0c0c0", color: "#000" };
  if (r === 3) return { background: "#cd7f32", color: "#fff" };
  return { background: "rgba(255,255,255,0.12)", color: "#fff" };
}

export default function Top10Carousel({ movies }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag     = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  function onDown(e: React.MouseEvent) {
    drag.current = { down: true, startX: e.pageX - (trackRef.current?.offsetLeft ?? 0), scrollLeft: trackRef.current?.scrollLeft ?? 0, moved: false };
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  }
  function onUp() {
    drag.current.down = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  }
  function onMove(e: React.MouseEvent) {
    if (!drag.current.down || !trackRef.current) return;
    e.preventDefault();
    const dx = e.pageX - (trackRef.current.offsetLeft ?? 0) - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    trackRef.current.scrollLeft = drag.current.scrollLeft - dx * 1.4;
  }
  function scroll(d: number) { trackRef.current?.scrollBy({ left: d * 640, behavior: "smooth" }); }

  return (
    <section style={{ padding: "40px 32px 0" }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>👑</span>
          <h2 style={{
            fontFamily:    "'Bebas Neue', sans-serif",
            fontSize:      "24px",
            letterSpacing: "1.5px",
            color:         "#fff",
            lineHeight:    1,
          }}>
            TOP 10 FEATURED REVIEWS
          </h2>
        </div>
        {/* Arrow nav */}
        <div style={{ display: "flex", gap: "8px" }}>
          {(["‹","›"] as const).map((arrow, i) => (
            <button
              key={arrow}
              onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                width:        "36px",
                height:       "36px",
                borderRadius: "50%",
                background:   "#111118",
                border:       "1px solid rgba(255,255,255,0.12)",
                color:        "#fff",
                fontSize:     "18px",
                cursor:       "pointer",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                transition:   "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget.style.background   = "#ff2c2c");
                (e.currentTarget.style.borderColor  = "#ff2c2c");
              }}
              onMouseLeave={e => {
                (e.currentTarget.style.background   = "#111118");
                (e.currentTarget.style.borderColor  = "rgba(255,255,255,0.12)");
              }}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>

      {/* ── Track ────────────────────────────────────────── */}
      <div
        ref={trackRef}
        onMouseDown={onDown}
        onMouseLeave={onUp}
        onMouseUp={onUp}
        onMouseMove={onMove}
        style={{
          display:           "flex",
          gap:               "12px",
          overflowX:         "auto",
          paddingBottom:     "8px",
          cursor:            "grab",
          scrollbarWidth:    "none",
          msOverflowStyle:   "none" as any,
          userSelect:        "none",
        }}
        className="no-scrollbar"
      >
        {movies.map((m, i) => {
          const rank = i + 1;
          const rs   = rankStyle(rank);
          const grad = posterGradient(m.language);
          const emo  = posterEmoji(m.language);

          return (
            <Link
              key={m.id}
              href={`/movies/${m.slug}`}
              onClick={e => { if (drag.current.moved) e.preventDefault(); }}
              style={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}
            >
              <div
                style={{
                  width:        "168px",
                  background:   "#111118",
                  borderRadius: "12px",
                  overflow:     "hidden",
                  border:       rank === 1 ? "2px solid rgba(255,180,0,0.55)" : "2px solid transparent",
                  transition:   "all 0.25s",
                  cursor:       "pointer",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform   = "scale(1.07)";
                  el.style.boxShadow   = "0 12px 40px rgba(0,0,0,0.7)";
                  el.style.borderColor = "#ffb400";
                  el.style.zIndex      = "10";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform   = "scale(1)";
                  el.style.boxShadow   = "none";
                  el.style.borderColor = rank === 1 ? "rgba(255,180,0,0.55)" : "transparent";
                  el.style.zIndex      = "1";
                }}
              >
                {/* Poster */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", background: grad, overflow: "hidden" }}>
                  {m.poster_url ? (
                    <Image
                      src={tmdbPosterUrl(m.poster_url) ?? m.poster_url}
                      alt={m.title}
                      fill
                      sizes="168px"
                      placeholder="blur"
                      blurDataURL={POSTER_BLUR_DATA}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>
                      {emo}
                    </div>
                  )}
                  {/* Bottom gradient */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />
                  {/* Rank badge */}
                  <div style={{
                    position:      "absolute",
                    top:           "8px",
                    left:          "8px",
                    width:         "24px",
                    height:        "24px",
                    borderRadius:  "6px",
                    display:       "flex",
                    alignItems:    "center",
                    justifyContent:"center",
                    fontFamily:    "'Bebas Neue', sans-serif",
                    fontSize:      "14px",
                    lineHeight:    1,
                    zIndex:        2,
                    ...rs,
                  }}>
                    {rank}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px 12px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff", lineHeight: 1.3, marginBottom: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffb400">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span style={{ color: "#ffb400", fontWeight: 700, fontSize: "13px" }}>
                      {m.ai_rating?.toFixed(1) ?? "–"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}