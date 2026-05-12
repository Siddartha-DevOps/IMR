// src/app/movies/page.tsx
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MovieCard from "@/components/movie/MovieCard";
import type { MovieWithRating, Language } from "@/types";
import type { Metadata } from "next";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "All Indian Movies — Browse & Filter | IMR",
  description:
    "Browse all Indian movies with AI ratings. Filter by language, genre, OTT platform, or year. Hindi, Telugu, Tamil, Malayalam and Kannada films.",
};

const LANGUAGES: Language[] = ["Hindi","Telugu","Tamil","Malayalam","Kannada"];
const GENRES   = ["Action","Drama","Thriller","Comedy","Romance","Horror","Sci-Fi","War","Biography"];
const VERDICTS = ["Blockbuster","Super Hit","Hit","Average","Flop"];
const SORT_OPTIONS = [
  { label:"Highest Rated",   value:"rating_desc"  },
  { label:"Newest First",    value:"date_desc"     },
  { label:"Most Reactions",  value:"reactions_desc"},
];

interface PageProps {
  searchParams: {
    lang?:    string;
    genre?:   string;
    verdict?: string;
    sort?:    string;
    page?:    string;
  };
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase   = createClient();
  const PAGE_SIZE  = 20;
  const currentPage = Number(params.page ?? 1);
  const lang     = params.lang;
  const genre    = params.genre;
  const verdict  = params.verdict;
  const sort     = params.sort ?? "rating_desc";

  let query = supabase
    .from("v_movies_with_ratings")
    .select("*", { count: "exact" })
    .eq("is_published", true);

  if (lang)    query = query.eq("language", lang);
  if (genre)   query = query.contains("genre", [genre]);
  if (verdict) query = query.eq("verdict", verdict);

  if (sort === "rating_desc")    query = query.order("ai_rating",       { ascending: false });
  else if (sort === "date_desc") query = query.order("release_date",    { ascending: false });
  else                           query = query.order("reactions_count", { ascending: false });

  query = query.range(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE - 1
  );

  const { data, count, error } = await query;

  const movies      = (data as MovieWithRating[] | null) ?? [];
  const totalPages  = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Build filter URL helper
  function filterUrl(key: string, value: string) {
    const p = new URLSearchParams();
    if (lang)    p.set("lang",    lang);
    if (genre)   p.set("genre",   genre);
    if (verdict) p.set("verdict", verdict);
    if (sort)    p.set("sort",    sort);
    p.set(key, value);
    p.set("page", "1");
    return `/movies?${p.toString()}`;
  }

  function clearUrl(key: string) {
    const p = new URLSearchParams();
    if (lang    && key !== "lang")    p.set("lang",    lang);
    if (genre   && key !== "genre")   p.set("genre",   genre);
    if (verdict && key !== "verdict") p.set("verdict", verdict);
    if (sort)                         p.set("sort",    sort);
    p.set("page", "1");
    return `/movies?${p.toString()}`;
  }

  const activeFilters = [
    lang    && { key:"lang",    label:`Language: ${lang}`     },
    genre   && { key:"genre",   label:`Genre: ${genre}`       },
    verdict && { key:"verdict", label:`Verdict: ${verdict}`   },
  ].filter(Boolean) as { key:string; label:string }[];

  return (
    <>
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-[5%] pt-24 pb-16">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">
            Indian <span className="text-gold">Movies</span>
          </h1>
          <p className="text-muted text-sm">
            {count?.toLocaleString("en-IN") ?? "0"} movies with AI ratings
          </p>
        </div>

        {/* Filters */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-8 space-y-4">
          {/* Language filter */}
          <div>
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">Language</div>
            <div className="flex flex-wrap gap-2">
              <a
                href={clearUrl("lang")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  !lang ? "bg-gold text-bg border-gold" : "border-border text-muted hover:text-white hover:border-white/30"
                }`}
              >
                All
              </a>
              {LANGUAGES.map((l) => (
                <a
                  key={l}
                  href={filterUrl("lang", l)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    lang === l ? "bg-gold text-bg border-gold" : "border-border text-muted hover:text-white hover:border-white/30"
                  }`}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Genre filter */}
            <div>
              <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">Genre</div>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <a
                    key={g}
                    href={filterUrl("genre", g)}
                    className={`text-xs px-2.5 py-1 rounded border transition-all ${
                      genre === g
                        ? "bg-accent/20 border-accent text-accent"
                        : "border-border text-muted hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {g}
                  </a>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">Sort by</div>
              <div className="flex flex-col gap-1.5">
                {SORT_OPTIONS.map((o) => (
                  <a
                    key={o.value}
                    href={filterUrl("sort", o.value)}
                    className={`text-xs px-3 py-1.5 rounded border transition-all w-fit ${
                      sort === o.value
                        ? "bg-white/10 border-white/20 text-white"
                        : "border-border text-muted hover:text-white"
                    }`}
                  >
                    {o.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="pt-2 border-t border-border flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted">Active:</span>
              {activeFilters.map((f) => (
                <a
                  key={f.key}
                  href={clearUrl(f.key)}
                  className="flex items-center gap-1 text-xs bg-gold/10 border border-gold/25 text-gold px-2.5 py-1 rounded-full hover:bg-gold/20 transition-all"
                >
                  {f.label} ✕
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Movie Grid */}
        {error ? (
          <div className="text-center py-20 text-muted">
            Failed to load movies. Please try again.
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎬</div>
            <div className="text-white font-heading font-bold text-xl mb-2">No movies found</div>
            <div className="text-muted text-sm">Try adjusting your filters.</div>
            <a href="/movies" className="btn-outline mt-4 inline-flex">Clear all filters</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <a href={filterUrl("page", String(currentPage - 1))} className="btn-ghost text-sm px-4 py-2">
                ← Previous
              </a>
            )}
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + Math.max(1, currentPage - 3);
                if (p > totalPages) return null;
                return (
                  <a
                    key={p}
                    href={filterUrl("page", String(p))}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm border transition-all ${
                      p === currentPage
                        ? "bg-gold text-bg border-gold font-bold"
                        : "border-border text-muted hover:text-white hover:border-white/30"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
            {currentPage < totalPages && (
              <a href={filterUrl("page", String(currentPage + 1))} className="btn-ghost text-sm px-4 py-2">
                Next →
              </a>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}