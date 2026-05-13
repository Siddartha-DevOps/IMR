"use client";
// src/components/home/LanguageRow.tsx
// Netflix-style horizontal scroll row for one language.

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { POSTER_BLUR_DATA, posterGradient, posterEmoji, tmdbPosterUrl } from "@/lib/tmdb";
import type { MovieWithRating } from "@/types";

interface Props {
  title:      string;
  dotColor:   string;
  movies:     MovieWithRating[];
  seeAllHref: string;
}

const OTT_COLORS: Record<string, string> = {
  "Netflix":         "rgba(229,9,20,0.9)",
  "Prime Video":     "rgba(0,168,224,0.9)",
  "Prime":           "rgba(0,168,224,0.9)",
  "Disney+ Hotstar": "rgba(31,128,224,0.9)",
  "Hotstar":         "rgba(31,128,224,0.9)",
  "ZEE5":            "rgba(139,92,246,0.9)",
  "SonyLIV":         "rgba(30,144,255,0.9)",
  "JioCinema":       "rgba(79,70,229,0.9)",
  "Theatre":         "rgba(255,44,44,0.9)",
};

function ottLabel(m: MovieWithRating): string | null {
  if (m.ott_platform) return m.ott_platform;
  if (m.release_type === "Theatrical") return "Theatre";
  return null;
}

export default function LanguageRow({ title, dotColor, movies, seeAllHref }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag     = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  function onDown(e: React.MouseEvent) {
    drag.current = { down: true, startX: e.pageX - (trackRef.current?.offsetLeft ?? 0), scrollLeft: trackRef.current?.scrollLeft ?? 0, moved: false };
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  }
  function onUp() { drag.current.down = false; if (trackRef.current) trackRef.current.style.cursor = "grab"; }
  function onMove(e: React.MouseEvent) {
    if (!drag.current.down || !trackRef.current) return;
    e.preventDefault();
    const dx = e.pageX - (trackRef.current.offsetLeft ?? 0) - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    trackRef.current.scrollLeft = drag.current.scrollLeft - dx * 1.4;
  }

  if (!movies.length) return null;

  return (
    <section style={{ padding: "36px 32px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", letterSpacing: "1px", color: "#fff", lineHeight: 1 }}>
            {title}
          </h2>
        </div>
        <Link href={seeAllHref} style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          See all ›
        </Link>
      </div>

      {/* Scrollable row */}
      <div
        ref={trackRef}
        onMouseDown={onDown}
        onMouseLeave={onUp}
        onMouseUp={onUp}
        onMouseMove={onMove}
        className="no-scrollbar"
        style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px", cursor: "grab", userSelect: "none" }}
      >
        {movies.map(m => {
          const label = ottLabel(m);
          const lc    = label ? (OTT_COLORS[label] ?? "rgba(255,255,255,0.2)") : null;
          const grad  = posterGradient(m.language);
          const emo   = posterEmoji(m.language);
          const pos   = m.positive_sentiment ?? 0;
          const neu   = m.neutral_sentiment  ?? 0;
          const neg   = m.negative_sentiment ?? 0;

          return (
            <Link
              key={m.id}
              href={`/movies/${m.slug}`}
              onClick={e => { if (drag.current.moved) e.preventDefault(); }}
              style={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}
            >
              <div
                style={{ width: "148px", background: "#111118", borderRadius: "10px", overflow: "hidden", cursor: "pointer", transition: "transform 0.25s, box-shadow 0.25s" }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform  = "translateY(-6px) scale(1.03)";
                  el.style.boxShadow  = "0 14px 36px rgba(0,0,0,0.7)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform  = "translateY(0) scale(1)";
                  el.style.boxShadow  = "none";
                }}
              >
                {/* Poster */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", background: grad, overflow: "hidden" }}>
                  {m.poster_url ? (
                    <Image src={tmdbPosterUrl(m.poster_url) ?? m.poster_url} alt={m.title} fill sizes="148px" placeholder="blur" blurDataURL={POSTER_BLUR_DATA} style={{ objectFit: "cover", transition: "transform 0.4s" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px" }}>{emo}</div>
                  )}
                  {/* Overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                  {/* OTT badge */}
                  {label && lc && (
                    <span style={{
                      position:    "absolute", top: "7px", right: "7px",
                      background:  lc,
                      borderRadius: "4px",
                      padding:     "2px 7px",
                      fontSize:    "9px",
                      fontWeight:  800,
                      color:       "#fff",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      backdropFilter: "blur(6px)",
                      zIndex:      2,
                    }}>
                      {label === "Prime Video" ? "PRIME" : label.toUpperCase().slice(0,8)}
                    </span>
                  )}
                  {/* Rating badge */}
                  {m.ai_rating && (
                    <div style={{
                      position:    "absolute", bottom: "7px", right: "7px",
                      background:  "rgba(0,0,0,0.72)",
                      backdropFilter: "blur(6px)",
                      border:      "1px solid rgba(255,180,0,0.35)",
                      borderRadius: "6px",
                      padding:     "3px 8px",
                      display:     "flex",
                      alignItems:  "center",
                      gap:         "3px",
                      zIndex:      2,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffb400">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span style={{ color: "#ffb400", fontWeight: 700, fontSize: "11px" }}>{m.ai_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "9px 10px 11px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.title}
                  </p>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: "3px" }}>
                      {m.release_date ? new Date(m.release_date).getFullYear() : "—"}
                    </span>
                    {m.genre?.[0] && (
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: "3px", maxWidth: "72px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.genre[0]}
                      </span>
                    )}
                  </div>
                  {/* Sentiment mini bar */}
                  {(pos + neu + neg) > 0 && (
                    <div style={{ display: "flex", height: "2px", borderRadius: "1px", overflow: "hidden" }}>
                      <div style={{ background: "#1db954", flex: pos }} />
                      <div style={{ background: "#ffb400", flex: neu }} />
                      <div style={{ background: "#ff2c2c", flex: neg }} />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}