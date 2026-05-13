// src/app/page.tsx
// ─────────────────────────────────────────────────────────────
// IMR Homepage — Server Component
//
// WHAT THIS PAGE DOES:
//   1. Fetches top movies from Supabase (server-side, zero client JS cost)
//   2. Passes data to client components (HeroSection, Top10Carousel, LanguageRow)
//   3. Revalidates every 30 minutes via ISR
//   4. Falls back to static data during development (before DB has data)
//
// HOW POSTERS APPEAR:
//   - movies.poster_url   → card thumbnails, Top10 posters
//   - movies.backdrop_url → hero background (full-width cinematic backdrop)
//   Both are auto-saved by Agent 1 from TMDB. Nothing manual.
// ─────────────────────────────────────────────────────────────

import { createClient }   from "@/lib/supabase/server";
import Navbar             from "@/components/layout/Navbar";
import Footer             from "@/components/layout/Footer";
import HeroSection        from "@/components/home/HeroSection";
import Top10Carousel      from "@/components/home/Top10Carousel";
import LanguageRow        from "@/components/home/LanguageRow";
import type { MovieWithRating } from "@/types";

// Revalidate every 30 minutes (ISR)
export const revalidate = 1800;

// ── Language row config ───────────────────────────────────────
const LANGUAGE_ROWS: { language: string; title: string; dotColor: string }[] = [
  { language: "Telugu",    title: "Telugu Movies",    dotColor: "#a78bfa" },
  { language: "Tamil",     title: "Tamil Movies",     dotColor: "#34d399" },
  { language: "Hindi",     title: "Hindi Movies",     dotColor: "#fb923c" },
  { language: "Malayalam", title: "Malayalam Movies", dotColor: "#60a5fa" },
  { language: "Kannada",   title: "Kannada Movies",   dotColor: "#f472b6" },
  { language: "English",   title: "English Movies",   dotColor: "#94a3b8" },
];

// ── Fallback data (shown before Supabase has any data) ────────
// Replace this with real data once your pipeline runs once.
const FALLBACK: MovieWithRating[] = [
  { id:"1", title:"Pushpa 2: The Rule", slug:"pushpa-2-the-rule", language:"Telugu", release_date:"2024-12-05", release_type:"Theatrical", status:"published", genre:["Action","Thriller","Drama"], director:"Sukumar", runtime_minutes:200, summary:"Pushpa Raj is back. The rule begins as Pushpa rises higher, faces stronger enemies and fights for power, loyalty and his empire.", ai_rating:9.1, verdict:"Blockbuster", positive_sentiment:87, neutral_sentiment:9, negative_sentiment:4, reactions_count:24500, poster_url:null, backdrop_url:null, created_at:"", updated_at:"" },
  { id:"2", title:"Kalki 2898 AD",      slug:"kalki-2898-ad",     language:"Telugu", release_date:"2024-06-27", release_type:"OTT", ott_platform:"Prime Video", status:"published", genre:["Sci-Fi","Action","Fantasy"], director:"Nag Ashwin", runtime_minutes:181, summary:"Set in a dystopian future, a warrior rises to protect humanity. The most ambitious Indian sci-fi spectacle ever made.", ai_rating:8.7, verdict:"Blockbuster", positive_sentiment:78, neutral_sentiment:14, negative_sentiment:8, reactions_count:18200, poster_url:null, backdrop_url:null, created_at:"", updated_at:"" },
  { id:"3", title:"Amaran",             slug:"amaran",            language:"Tamil",  release_date:"2024-11-01", release_type:"OTT", ott_platform:"Netflix", status:"published", genre:["War","Drama","Biography"], director:"Rajkumar Periyasamy", runtime_minutes:162, summary:"The extraordinary true story of Major Mukund Varadarajan — a film that will make you cry, salute and feel proud.", ai_rating:9.0, verdict:"Blockbuster", positive_sentiment:85, neutral_sentiment:9, negative_sentiment:6, reactions_count:15800, poster_url:null, backdrop_url:null, created_at:"", updated_at:"" },
  { id:"4", title:"Stree 2",            slug:"stree-2",           language:"Hindi",  release_date:"2024-08-15", release_type:"OTT", ott_platform:"Prime Video", status:"published", genre:["Horror","Comedy","Action"], director:"Amar Kaushik", runtime_minutes:133, summary:"The ghost is back but this time she has competition. Bollywood's biggest horror-comedy delivers laughs, scares, and heart.", ai_rating:8.6, verdict:"Blockbuster", positive_sentiment:82, neutral_sentiment:11, negative_sentiment:7, reactions_count:22100, poster_url:null, backdrop_url:null, created_at:"", updated_at:"" },
];

// ── Helper: fetch movies by language ─────────────────────────
async function fetchByLanguage(
  supabase: ReturnType<typeof createClient>,
  language: string
): Promise<MovieWithRating[]> {
  const { data } = await supabase
    .from("v_movies_with_ratings")
    .select("*")
    .eq("language", language)
    .eq("is_published", true)
    .order("ai_rating", { ascending: false })
    .limit(12);
  return (data ?? []) as MovieWithRating[];
}

// ── Page ──────────────────────────────────────────────────────
export default async function HomePage() {
  const supabase = createClient();

  // Fetch hero movies (top 4 by rating, with backdrop)
  let heroMovies: MovieWithRating[] = [];
  let top10:       MovieWithRating[] = [];

  try {
    const { data: topMovies } = await supabase
      .from("v_movies_with_ratings")
      .select("*")
      .eq("is_published", true)
      .order("ai_rating", { ascending: false })
      .limit(10);

    const all = (topMovies ?? []) as MovieWithRating[];
    top10       = all;
    heroMovies  = all.slice(0, 4);
  } catch {
    // DB not ready yet — use fallback
    heroMovies = FALLBACK;
    top10      = FALLBACK;
  }

  if (heroMovies.length === 0) heroMovies = FALLBACK;
  if (top10.length      === 0) top10      = FALLBACK;

  // Fetch each language row in parallel
  const langData: Record<string, MovieWithRating[]> = {};
  try {
    const results = await Promise.all(
      LANGUAGE_ROWS.map((row) => fetchByLanguage(supabase, row.language))
    );
    LANGUAGE_ROWS.forEach((row, i) => {
      langData[row.language] = results[i];
    });
  } catch {
    // Silently fall back to empty rows during dev
  }

  return (
    <>
      <Navbar />

      {/* ── Hero (auto-rotating, 10s) ──────────────────────── */}
      <div className="pt-[70px]">
        <HeroSection movies={heroMovies as any} />
      </div>

      {/* ── Top 10 Carousel ────────────────────────────────── */}
      <Top10Carousel movies={top10} />

      {/* ── Language Rows (Netflix-style) ───────────────────── */}
      {LANGUAGE_ROWS.map((row) => {
        const movies = langData[row.language] ?? [];
        if (movies.length === 0) return null;
        return (
          <LanguageRow
            key={row.language}
            title={row.title}
            dotColor={row.dotColor}
            movies={movies}
            seeAllHref={`/movies?lang=${row.language}`}
          />
        );
      })}

      <div className="pb-16" />
      <Footer />
    </>
  );
}