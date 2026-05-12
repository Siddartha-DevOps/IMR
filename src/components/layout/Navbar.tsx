"use client";
// src/components/layout/Navbar.tsx
import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Globe, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/",         label: "Home"      },
  { href: "/movies",   label: "Movies"    },
  { href: "/ott",      label: "OTT"       },
  { href: "/actors",   label: "Actors"    },
  { href: "/top-rated",label: "Top Rated" },
];

const LANGUAGES = [
  "All Languages", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada",
];

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [langIdx, setLangIdx]           = useState(0);
  const [searchOpen, setSearchOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* MAIN NAV */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
          scrolled
            ? "bg-bg/95 backdrop-blur-xl border-b border-border/60 shadow-lg shadow-black/20"
            : "bg-bg/80 backdrop-blur-md border-b border-white/5"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-[5%] flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 font-heading font-extrabold text-xl">
            <span className="text-gold">I</span>MR
            <span className="bg-gold text-bg text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest ml-1">
              AI
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted hover:text-white text-sm font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 bg-white/5 border border-border hover:border-accent/50 rounded-lg px-3 py-2 text-sm text-muted transition-all hover:bg-white/8"
            >
              <Search size={14} />
              <span>Search movies...</span>
              <span className="ml-4 bg-white/7 text-[11px] px-1.5 py-0.5 rounded text-muted/70">
                ⌘K
              </span>
            </button>

            {/* Language */}
            <button
              onClick={() => setLangIdx((i) => (i + 1) % LANGUAGES.length)}
              className="hidden md:flex items-center gap-1.5 bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-muted hover:text-white transition-colors"
            >
              <Globe size={14} />
              {LANGUAGES[langIdx]}
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 text-muted hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-bg-card px-6 py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block text-muted hover:text-white py-2.5 text-sm font-medium transition-colors border-b border-border/40 last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* SEARCH MODAL */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[200] bg-bg/90 backdrop-blur-xl flex items-start justify-center pt-28 px-4"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search size={18} className="text-muted flex-shrink-0" />
              <input
                autoFocus
                placeholder="Search movies, actors, directors..."
                className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-muted"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-muted hover:text-white text-sm"
              >
                ESC
              </button>
            </div>
            <div className="p-3">
              <div className="text-[11px] text-muted font-semibold tracking-wider px-3 py-2">
                TRENDING
              </div>
              {[
                { emoji: "🌿", title: "Pushpa 2: The Rule", meta: "Telugu • 2024", rating: "9.1" },
                { emoji: "⚔️", title: "Kalki 2898 AD",      meta: "Telugu • 2024", rating: "8.7" },
                { emoji: "🦁", title: "Amaran",              meta: "Tamil • 2024",  rating: "9.0" },
                { emoji: "🔥", title: "Stree 2",             meta: "Hindi • 2024",  rating: "8.6" },
              ].map((m) => (
                <div
                  key={m.title}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer group"
                >
                  <div className="w-8 h-10 rounded bg-bg-card2 flex items-center justify-center text-lg border border-border/50">
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold group-hover:text-gold transition-colors truncate">
                      {m.title}
                    </div>
                    <div className="text-xs text-muted">{m.meta}</div>
                  </div>
                  <div className="text-gold font-bold text-sm font-heading">
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