// src/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MovieCard from "@/components/movie/MovieCard";
import Link from "next/link";
import type { MovieWithRating } from "@/types";
import { ChevronRight } from "lucide-react";

// Revalidate every 30 minutes
export const revalidate = 1800;

// ─── Static fallback data (used when DB is empty during dev) ───
const FALLBACK_MOVIES: MovieWithRating[] = [
  { id:"1", title:"Pushpa 2: The Rule", slug:"pushpa-2-the-rule", language:"Telugu", release_date:"2024-12-05", release_type:"Theatrical", status:"published", ai_rating:9.1, verdict:"Blockbuster", positive_sentiment:87, neutral_sentiment:9, negative_sentiment:4, reactions_count:24500, genre:["Action","Thriller"], director:"Sukumar", runtime_minutes:200, created_at:"", updated_at:"" },
  { id:"2", title:"Kalki 2898 AD",      slug:"kalki-2898-ad",      language:"Telugu", release_date:"2024-06-27", release_type:"Theatrical", status:"published", ai_rating:8.7, verdict:"Blockbuster", positive_sentiment:78, neutral_sentiment:14, negative_sentiment:8,  reactions_count:18200, genre:["Sci-Fi","Action"],  director:"Nag Ashwin",   runtime_minutes:181, created_at:"", updated_at:"" },
  { id:"3", title:"Amaran",             slug:"amaran",             language:"Tamil",  release_date:"2024-11-01", release_type:"Theatrical", status:"published", ai_rating:9.0, verdict:"Blockbuster", positive_sentiment:85, neutral_sentiment:9,  negative_sentiment:6,  reactions_count:15800, genre:["War","Drama"],    director:"Rajkumar Periyasamy", runtime_minutes:162, created_at:"", updated_at:"" },
  { id:"4", title:"Stree 2",            slug:"stree-2",            language:"Hindi",  release_date:"2024-08-15", release_type:"Theatrical", status:"published", ai_rating:8.6, verdict:"Blockbuster", positive_sentiment:82, neutral_sentiment:11, negative_sentiment:7,  reactions_count:22100, genre:["Horror","Comedy"],director:"Amar Kaushik", runtime_minutes:133, created_at:"", updated_at:"" },
  { id:"5", title:"Lucky Baskhar",      slug:"lucky-baskhar",      language:"Telugu", release_date:"2024-10-31", release_type:"Theatrical", status:"published", ai_rating:8.5, verdict:"Hit",         positive_sentiment:79, neutral_sentiment:12, negative_sentiment:9,  reactions_count:9400,  genre:["Thriller","Drama"],director:"Venky Atluri", runtime_minutes:148, created_at:"", updated_at:"" },
];

const TICKER_MOVIES = [
  { title:"Pushpa 2", rating:"9.1" }, { title:"Kalki 2898 AD", rating:"8.7" },
  { title:"Amaran", rating:"9.0" }, { title:"Stree 2", rating:"8.6" },
  { title:"Vettaiyan", rating:"8.2" }, { title:"Lucky Baskhar", rating:"8.5" },
  { title:"Devara", rating:"7.4" }, { title:"GOAT", rating:"7.1" },
];

const STATS = [
  { num:"2,400+", label:"Movies reviewed"      },
  { num:"1.2M+",  label:"Reactions analyzed"   },
  { num:"5",      label:"Indian languages"      },
  { num:"99.2%",  label:"Sentiment accuracy"    },
];

export default async function HomePage() {
  const supabase = createClient();
  let movies: MovieWithRating[] = FALLBACK_MOVIES;

  try {
    const { data } = await supabase
      .from("v_movies_with_ratings")
      .select("*")
      .eq("is_published", true)
      .order("ai_rating", { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      movies = data as MovieWithRating[];
    }
  } catch {
    // silently use fallback
  }

  const featured = movies[0];
  const trending = movies.slice(0, 5);
  const latest   = movies.slice(0, 4);

  return (
    <>
      <Navbar />

      {/* ── TICKER ─────────────────────────────────── */}
      <div className="mt-16 overflow-hidden bg-gold/5 border-y border-gold/15">
        <div className="flex gap-0 py-2.5" style={{ animation:"ticker 30s linear infinite", width:"max-content" }}>
          {[...TICKER_MOVIES, ...TICKER_MOVIES].map((m, i) => (
            <div key={i} className="flex items-center gap-2 px-7 text-sm font-medium whitespace-nowrap">
              <span className="text-gold text-xs">★</span>
              <span className="text-white">{m.title}</span>
              <span className="text-gold font-bold font-heading">{m.rating}/10</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient min-h-[92vh] flex items-end pb-20">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size" />
        <div className="absolute top-1/4 right-[10%] w-[500px] h-[500px] hero-glow pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.07),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-[5%] w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-end">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5 text-xs font-bold text-gold tracking-wide mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              FEATURED REVIEW
            </div>
            <h1 className="font-heading text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-4">
              {featured?.title?.split(":")[0]}
              {featured?.title?.includes(":") && (
                <>
                  :<br />
                  <span className="text-gradient-gold">{featured.title.split(":")[1]}</span>
                </>
              )}
            </h1>
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                featured?.release_date ? new Date(featured.release_date).getFullYear().toString() : "2024",
                featured?.genre?.[0],
                featured?.runtime_minutes ? `${Math.floor(featured.runtime_minutes / 60)}h ${featured.runtime_minutes % 60}m` : null,
                featured?.language,
              ].filter(Boolean).map((tag) => (
                <span key={tag} className="bg-white/7 border border-border/50 rounded px-3 py-1 text-xs text-muted font-medium">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-muted text-base leading-relaxed max-w-xl mb-8">
              {featured?.summary || "An epic cinematic experience that has broken every record in Indian cinema. A masterclass in mass entertainment."}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href={`/movies/${featured?.slug}`} className="btn-primary">
                📖 Read Full Review
              </Link>
              <button className="btn-ghost">
                📊 Sentiment Analysis
              </button>
            </div>
          </div>

          {/* Rating sidebar */}
          <div className="card p-5 lg:mb-0">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] text-muted font-bold tracking-widest uppercase mb-1">AI RATING</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-black text-gold leading-none">
                    {featured?.ai_rating?.toFixed(1)}
                  </span>
                  <span className="text-muted text-sm">/ 10</span>
                </div>
                <div className="text-gold text-sm mt-1">★★★★★</div>
              </div>
              <span className="border border-green-500/25 bg-green-500/10 text-sentiment-positive text-xs font-bold px-3 py-1.5 rounded-full">
                {featured?.verdict?.toUpperCase() ?? "BLOCKBUSTER"} 🔥
              </span>
            </div>
            <div className="border-t border-border pt-4 mb-4">
              <div className="text-[10px] text-muted font-bold tracking-wider uppercase mb-3">
                SENTIMENT BREAKDOWN
              </div>
              {[
                { emoji:"😍", label:"Positive", val:featured?.positive_sentiment??87, cls:"bg-sentiment-positive", color:"text-sentiment-positive" },
                { emoji:"😐", label:"Neutral",  val:featured?.neutral_sentiment??9,  cls:"bg-gold",               color:"text-gold" },
                { emoji:"😤", label:"Negative", val:featured?.negative_sentiment??4,  cls:"bg-sentiment-negative", color:"text-sentiment-negative" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                  <span className="text-base w-5">{s.emoji}</span>
                  <span className="text-xs text-muted w-14 font-medium">{s.label}</span>
                  <div className="flex-1 bg-white/5 rounded h-1.5 overflow-hidden">
                    <div className={`${s.cls} h-full rounded transition-all duration-700`} style={{ width:`${s.val}%` }} />
                  </div>
                  <span className={`text-xs font-bold font-heading ${s.color} w-9 text-right`}>{s.val}%</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-muted text-center border-t border-border pt-3">
              Based on {(featured?.reactions_count ?? 24500).toLocaleString("en-IN")}+ reactions • Updated 2h ago
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────── */}
      <div className="bg-gold/[0.04] border-y border-gold/10">
        <div className="max-w-[1400px] mx-auto px-[5%] py-10 grid grid-cols-2 md:grid-cols-4 gap-5">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-heading text-3xl font-black text-gold">{s.num}</div>
              <div className="text-muted text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRENDING NOW ───────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-[5%] py-14">
        <div className="flex justify-between items-center mb-7">
          <h2 className="section-title font-heading">
            <span className="section-dot" />
            Trending <span className="text-gold">Now</span>
          </h2>
          <Link href="/movies" className="flex items-center gap-1 text-accent text-sm font-medium hover:underline">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {trending.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      {/* ── LATEST REVIEWS ─────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-[5%] pb-14">
        <div className="flex justify-between items-center mb-7">
          <h2 className="section-title font-heading">
            <span className="section-dot" />
            Latest <span className="text-gold">AI Reviews</span>
          </h2>
          <Link href="/movies" className="flex items-center gap-1 text-accent text-sm font-medium hover:underline">
            All reviews <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {latest.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.slug}`}
              className="flex gap-0 bg-bg-card border border-border rounded-[14px] overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-24 flex-shrink-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 flex items-center justify-center text-4xl border-r border-border">
                🎬
              </div>
              <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-heading font-bold text-sm leading-snug group-hover:text-gold transition-colors truncate">
                      {movie.title}
                    </h3>
                    {movie.ai_rating && (
                      <span className="bg-gold/10 border border-gold/25 rounded px-2 py-0.5 text-gold font-bold text-sm font-heading flex-shrink-0">
                        ⭐ {movie.ai_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-muted text-xs leading-relaxed line-clamp-2">
                    An AI-powered review analyzing {movie.reactions_count?.toLocaleString() ?? "thousands of"} audience reactions...
                  </p>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-purple-300 bg-purple-500/10 border-purple-500/20">
                      {movie.language}
                    </span>
                    {movie.genre?.[0] && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-muted border-border bg-white/3">
                        {movie.genre[0]}
                      </span>
                    )}
                  </div>
                  {movie.release_date && (
                    <span className="text-[11px] text-muted">
                      {new Date(movie.release_date).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}