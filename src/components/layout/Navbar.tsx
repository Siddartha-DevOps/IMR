"use client";
// src/components/layout/Navbar.tsx
// Pixel-perfect match to the CineAI-style navbar — branded as IMR

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/",         label: "Home"     },
  { href: "/movies",   label: "Movies"   },
  { href: "/ott",      label: "OTT"      },
  { href: "/theatre",  label: "Theatre"  },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/genres",   label: "Genres"   },
];

const QUICK_RESULTS = [
  { emoji: "🌿", title: "Pushpa 2: The Rule",  lang: "Telugu", year: 2024, rating: "9.1" },
  { emoji: "⚔️", title: "Kalki 2898 AD",        lang: "Telugu", year: 2024, rating: "8.7" },
  { emoji: "🦁", title: "Amaran",               lang: "Tamil",  year: 2024, rating: "9.0" },
  { emoji: "👻", title: "Stree 2",              lang: "Hindi",  year: 2024, rating: "8.6" },
  { emoji: "🔱", title: "Vettaiyan",            lang: "Tamil",  year: 2024, rating: "8.2" },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* scroll detection */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* keyboard shortcuts */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  /* focus input when modal opens */
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  const results = query
    ? QUICK_RESULTS.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
    : QUICK_RESULTS;

  return (
    <>
      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <header
        style={{
          position:       "fixed",
          top:            0,
          left:           0,
          right:          0,
          zIndex:         100,
          height:         "70px",
          display:        "flex",
          alignItems:     "center",
          padding:        "0 32px",
          gap:            "24px",
          background:     scrolled ? "rgba(10,10,15,0.97)" : "rgba(10,10,15,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom:   "1px solid rgba(255,255,255,0.06)",
          transition:     "background 0.2s",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "1px", textDecoration: "none", flexShrink: 0 }}
        >
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", letterSpacing: "2px", color: "#ffb400" }}>
            I
          </span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", letterSpacing: "2px", color: "#ffffff" }}>
            MR
          </span>
          <span style={{
            marginLeft: "6px",
            background: "#ff2c2c",
            color: "#fff",
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "1.5px",
            padding: "2px 6px",
            borderRadius: "4px",
            lineHeight: "14px",
          }}>
            AI
          </span>
        </Link>

        {/* Center nav */}
        <nav style={{ display: "flex", gap: "4px", flex: 1, justifyContent: "center" }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: "rgba(255,255,255,0.55)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                padding: "6px 14px",
                borderRadius: "8px",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            "8px",
              background:     "rgba(255,255,255,0.05)",
              border:         "1px solid rgba(255,255,255,0.09)",
              borderRadius:   "10px",
              padding:        "8px 14px",
              color:          "rgba(255,255,255,0.35)",
              fontSize:       "13px",
              cursor:         "pointer",
              transition:     "all 0.2s",
              fontFamily:     "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Search movies, reviews...
            <span style={{
              marginLeft: "12px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "4px",
              padding: "1px 7px",
              fontSize: "10px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.25)",
            }}>
              ⌘K
            </span>
          </button>

          {/* Sign In */}
          <button
            style={{
              background:   "transparent",
              border:       "1px solid rgba(255,255,255,0.2)",
              borderRadius: "9px",
              color:        "#fff",
              padding:      "8px 18px",
              fontSize:     "13px",
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "'DM Sans', sans-serif",
              transition:   "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Sign In
          </button>

          {/* Sign Up */}
          <button
            style={{
              background:   "#ff2c2c",
              border:       "none",
              borderRadius: "9px",
              color:        "#fff",
              padding:      "8px 18px",
              fontSize:     "13px",
              fontWeight:   700,
              cursor:       "pointer",
              fontFamily:   "'DM Sans', sans-serif",
              boxShadow:    "0 0 20px rgba(255,44,44,0.35)",
              transition:   "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.background   = "#e01e1e");
              (e.currentTarget.style.transform    = "translateY(-1px)");
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background   = "#ff2c2c");
              (e.currentTarget.style.transform    = "translateY(0)");
            }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* ── SEARCH MODAL ────────────────────────────────────── */}
      {searchOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setSearchOpen(false)}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         300,
            background:     "rgba(5,5,10,0.92)",
            backdropFilter: "blur(24px)",
            display:        "flex",
            alignItems:     "flex-start",
            justifyContent: "center",
            paddingTop:     "120px",
            paddingLeft:    "16px",
            paddingRight:   "16px",
          }}
        >
          <div style={{
            width:        "100%",
            maxWidth:     "600px",
            background:   "#16161f",
            border:       "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            overflow:     "hidden",
            boxShadow:    "0 32px 80px rgba(0,0,0,0.7)",
          }}>
            {/* Input */}
            <div style={{
              display:       "flex",
              alignItems:    "center",
              gap:           "12px",
              padding:       "16px 20px",
              borderBottom:  "1px solid rgba(255,255,255,0.06)",
            }}>
              <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies, reviews, actors..."
                style={{
                  flex:        1,
                  background:  "transparent",
                  border:      "none",
                  outline:     "none",
                  color:       "#fff",
                  fontSize:    "16px",
                  fontFamily:  "'DM Sans', sans-serif",
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                style={{
                  background:   "rgba(255,255,255,0.06)",
                  border:       "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color:        "rgba(255,255,255,0.4)",
                  fontSize:     "11px",
                  fontWeight:   700,
                  padding:      "3px 9px",
                  cursor:       "pointer",
                  fontFamily:   "'DM Sans', sans-serif",
                }}
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div style={{ padding: "8px 12px 12px" }}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "8px 10px 6px" }}>
                {query ? "Results" : "Trending Searches"}
              </p>
              {results.length === 0 && (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", padding: "20px 0" }}>
                  No results for &quot;{query}&quot;
                </p>
              )}
              {results.map(m => (
                <div
                  key={m.title}
                  onClick={() => setSearchOpen(false)}
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           "12px",
                    padding:       "10px",
                    borderRadius:  "10px",
                    cursor:        "pointer",
                    transition:    "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: "36px", height: "48px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", flexShrink: 0,
                  }}>
                    {m.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{m.lang} · {m.year}</p>
                  </div>
                  <div style={{ color: "#ffb400", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                    ⭐ {m.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}