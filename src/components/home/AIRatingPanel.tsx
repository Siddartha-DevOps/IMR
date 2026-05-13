"use client";
// src/components/home/AIRatingPanel.tsx
// Pixel-perfect match to the AI Rating panel in the screenshot.
// Card: background #111118, rounded 16px, padding 25px, subtle glow.

import { useEffect, useRef } from "react";

export interface MovieMetrics {
  story:          number;
  performances:   number;
  direction:      number;
  cinematography: number;
  music:          number;
  entertainment:  number;
}

export interface MovieRatingData {
  rating:         number;        // 0–10
  verdict:        string;        // "MUST WATCH" | "RECOMMENDED" | etc
  positive:       number;        // % e.g. 88
  neutral:        number;
  negative:       number;
  reactionsCount: number;
  metrics:        MovieMetrics;
  socialBuzz:     "Very High" | "High" | "Medium" | "Low";
  trendRank:      number;        // e.g. 1 → "#1 This Week"
}

interface Props {
  data: MovieRatingData;
}

// Verdict → green for strong, gold for medium
function verdictColor(v: string): string {
  const s = v.toLowerCase();
  if (s.includes("must") || s.includes("block") || s.includes("hit")) return "#1db954";
  if (s.includes("recommend") || s.includes("watch")) return "#1db954";
  if (s.includes("average")) return "#ffb400";
  return "#ff2c2c";
}

// Stars: rating 0–10 → 0–5 stars
function starsFromRating(r: number): { full: number; empty: number } {
  const stars = Math.round((r / 10) * 5);
  return { full: Math.min(5, stars), empty: Math.max(0, 5 - stars) };
}

const METRICS_ORDER: [keyof MovieMetrics, string][] = [
  ["story",          "Story"          ],
  ["performances",   "Performances"   ],
  ["direction",      "Direction"      ],
  ["cinematography", "Cinematography" ],
  ["music",          "Music"          ],
  ["entertainment",  "Entertainment"  ],
];

export default function AIRatingPanel({ data }: Props) {
  const { rating, verdict, metrics, positive, neutral, negative, reactionsCount, socialBuzz, trendRank } = data;
  const { full: fullStars, empty: emptyStars } = starsFromRating(rating);
  const vc = verdictColor(verdict);

  // Animate metric bars on mount
  const barsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bars = barsRef.current?.querySelectorAll<HTMLDivElement>(".metric-fill");
    bars?.forEach((bar) => {
      const w = bar.dataset.width ?? "0";
      bar.style.width = "0";
      requestAnimationFrame(() => {
        setTimeout(() => { bar.style.width = w; }, 80);
      });
    });
  }, [data]);

  return (
    <div style={{
      background:    "#111118",
      borderRadius:  "0",
      height:        "100%",
      overflowY:     "auto",
      borderLeft:    "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ padding: "28px 26px" }}>

        {/* ── Title row ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffb400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "1.8px", textTransform: "uppercase" }}>
              AI RATING
            </span>
          </div>
        </div>

        {/* ── Score + Verdict ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "6px" }}>
          {/* Big number */}
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "68px", color: "#ffb400", lineHeight: 1, letterSpacing: "2px", flexShrink: 0 }}>
            {rating.toFixed(1)}
          </div>
          {/* Verdict block */}
          <div style={{ paddingTop: "8px" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: vc, lineHeight: 1.1, marginBottom: "4px" }}>
              {verdict.toUpperCase()}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              {rating >= 8.5 ? "High Recommendation" : rating >= 7 ? "Worth Watching" : "Mixed Reviews"}
            </div>
          </div>
        </div>

        {/* Stars */}
        <div style={{ display: "flex", gap: "3px", marginBottom: "6px" }}>
          {Array(fullStars).fill(0).map((_, i) => (
            <span key={`f${i}`} style={{ color: "#ffb400", fontSize: "18px", lineHeight: 1 }}>★</span>
          ))}
          {Array(emptyStars).fill(0).map((_, i) => (
            <span key={`e${i}`} style={{ color: "rgba(255,255,255,0.15)", fontSize: "18px", lineHeight: 1 }}>★</span>
          ))}
        </div>

        {/* Basis */}
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: "20px" }}>
          Based on AI Critics, Audience Sentiment<br />& Movie Analysis
        </p>

        {/* ── METRICS GRID (2 rows × 3 cols) ─────────────────── */}
        <div ref={barsRef} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 18px", marginBottom: "20px" }}>
          {METRICS_ORDER.map(([key, label]) => {
            const val  = metrics[key];
            const pct  = `${(val / 10) * 100}%`;
            return (
              <div key={key}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.38)", fontWeight: 500, marginBottom: "3px" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", letterSpacing: "1px", lineHeight: 1, marginBottom: "5px" }}>
                  {val.toFixed(1)}
                </div>
                <div style={{ height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    className="metric-fill"
                    data-width={pct}
                    style={{ height: "100%", background: "#1db954", borderRadius: "2px", width: pct, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SOCIAL INTELLIGENCE ROW ─────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {/* Audience Sentiment */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "12px 10px",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "20px", display: "block", marginBottom: "5px" }}>👥</span>
            <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
              {positive}%
            </span>
            <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
              Audience Sentiment<br />Positive
            </span>
          </div>

          {/* Social Buzz */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "12px 10px",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "20px", display: "block", marginBottom: "5px" }}>📈</span>
            <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
              {socialBuzz}
            </span>
            <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
              Social Buzz<br />On the Internet
            </span>
          </div>

          {/* Trending */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "12px 10px",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "20px", display: "block", marginBottom: "5px" }}>🔥</span>
            <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
              #{trendRank}
            </span>
            <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
              Trending Movie<br />This Week
            </span>
          </div>
        </div>

        {/* ── AI WATCH DECISION ───────────────────────────────── */}
        <div style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent:"space-between",
          background:    "rgba(255,255,255,0.03)",
          border:        "1px solid rgba(255,255,255,0.07)",
          borderRadius:  "10px",
          padding:       "13px 16px",
          marginBottom:  "12px",
          cursor:        "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🤖</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
              AI Watch Decision
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: vc }}>
              {verdict.toUpperCase()}
            </span>
            <span style={{ color: vc, opacity: 0.7, fontSize: "16px" }}>›</span>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", textAlign: "center" }}>
          AI Rating updated just now
        </p>

      </div>
    </div>
  );
}