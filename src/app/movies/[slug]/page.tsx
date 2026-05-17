// src/app/movies/[slug]/page.tsx
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RatingCard from "@/components/movie/RatingCard";
import SentimentBar from "@/components/movie/SentimentBar";
import FAQSection from "@/components/movie/FAQSection";
import {
  formatRuntime, formatBoxOffice, formatDate,
  cn,
} from "@/lib/utils";
import type { MovieDetail, Review, FAQItem, Verdict, CastMember } from "@/types";
import { ChevronRight, Share2, Bookmark } from "lucide-react";

// ISR: revalidate every hour
export const revalidate = 3600;

// Generate all published movie slugs at build time
export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("movies")
    .select("slug")
    .eq("status", "published")
    .limit(200);
  return (data ?? []).map((m) => ({ slug: m.slug }));
}

// Dynamic SEO metadata
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: movie } = await supabase
    .from("movies")
    .select("*, reviews(*)")
    .eq("slug", slug)
    .single();

  if (!movie) return { title: "Movie Not Found" };
  const review = (movie.reviews as Review[])?.[0];

  return {
    title: review?.seo_title ?? `${movie.title} Review: AI Rating ${review?.ai_rating}/10`,
    description: review?.meta_description ?? `AI-powered review of ${movie.title}. ${review?.reactions_count?.toLocaleString()} reactions analyzed.`,
    keywords: review?.keywords ?? [movie.title, movie.language, "movie review"],
    openGraph: {
      type: "article",
      images: movie.poster_url ? [movie.poster_url] : [],
      publishedTime: review?.published_at ?? undefined,
    },
    alternates: {
      canonical: `/movies/${movie.slug}`,
    },
  };
}

// ── Structured data for Google ──────────────────────
function getMovieSchema(movie: MovieDetail, review: Review | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    datePublished: movie.release_date,
    director: movie.director ? { "@type": "Person", name: movie.director } : undefined,
    description: movie.summary,
    review: review ? {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.ai_rating,
        bestRating: 10,
        worstRating: 0,
      },
      author: { "@type": "Organization", name: "IMR AI" },
      reviewBody: review.full_review_text?.slice(0, 500),
    } : undefined,
    aggregateRating: review ? {
      "@type": "AggregateRating",
      ratingValue: review.ai_rating,
      reviewCount: review.reactions_count,
      bestRating: 10,
      worstRating: 0,
    } : undefined,
  };
}

const SCORE_LABELS: [keyof Review, string][] = [
  ["score_story",         "Story & Plot"      ],
  ["score_acting",        "Acting"            ],
  ["score_direction",     "Direction"         ],
  ["score_music",         "Music (BGM)"       ],
  ["score_action",        "Action"            ],
  ["score_cinematography","Cinematography"    ],
  ["score_dialogue",      "Dialogue"          ],
  ["score_emotions",      "Emotional Impact"  ],
];

const HERO_SCORE_ITEMS: [keyof Review, string][] = [
  ["score_story", "Story"],
  ["score_acting", "Performances"],
  ["score_direction", "Direction"],
  ["score_cinematography", "Cinematography"],
  ["score_music", "Music"],
  ["score_action", "Entertainment"],
];

const PUSHPA_FALLBACK_MOVIE: any = {
  id: "pushpa-fallback",
  slug: "pushpa-2-the-rule",
  title: "Pushpa 2: The Rule",
  language: "Telugu",
  release_date: "2024-12-05",
  runtime_minutes: 179,
  genre: ["Action", "Drama", "Thriller"],
  summary:
    "Pushpa Raj is back! The Rule begins as Pushpa rises higher, faces stronger enemies and fights for power, loyalty and his empire.",
  director: "Sukumar",
  producer: "Mythri Movie Makers",
  music_director: "Devi Sri Prasad",
  box_office_inr: null,
  ott_platform: null,
  backdrop_url: null,
  poster_url: "/movies/pushpa2.jpg",
  cast_members: [{ name: "Allu Arjun", role: "Pushpa Raj", avatar_url: null }],
  reviews: [
    {
      ai_rating: 8.4,
      verdict: "Blockbuster",
      positive_sentiment: 88,
      neutral_sentiment: 8,
      negative_sentiment: 4,
      reactions_count: 25000,
      updated_at: new Date().toISOString(),
      score_story: 8.2,
      score_acting: 8.6,
      score_direction: 8.3,
      score_cinematography: 8.4,
      score_music: 8.1,
      score_action: 8.7,
      full_review_text: null,
      faq: [],
    },
  ],
};

export default async function MovieReviewPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: fetchedMovie, error } = await supabase
    .from("movies")
    .select("*, reviews(*)")
    .eq("slug", slug)
    .single();

  const isPushpaFallback = slug === "pushpa-2-the-rule";
  if ((error || !fetchedMovie) && !isPushpaFallback) notFound();
  const movie = (fetchedMovie ?? PUSHPA_FALLBACK_MOVIE) as any;

  const review = (movie.reviews as Review[])?.[0] ?? null;
  const cast   = (movie.cast_members as CastMember[] | null) ?? [];
  const faq    = (review?.faq    as FAQItem[]  | null) ?? [];
  const schema = getMovieSchema(movie as MovieDetail, review);
  const heroLeadActor = cast[0]?.name;
  const heroGenres = movie.genre?.slice(0, 3) ?? [];
  const heroBackdropSrc =
    slug === "pushpa-2-the-rule"
      ? "/movies/pushpa2.jpg"
      : (movie.backdrop_url || movie.poster_url || "/movies/pushpa2.jpg");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />

      {/* ── BREADCRUMB ─────────────────────────────── */}
      <div className="mt-16 border-b border-border bg-bg-card/30">
        <div className="max-w-[1300px] mx-auto px-[5%] py-3 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/movies" className="hover:text-white transition-colors">Movies</Link>
          <ChevronRight size={12} />
          <Link href={`/movies?lang=${movie.language}`} className="hover:text-white transition-colors">
            {movie.language}
          </Link>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-[200px]">{movie.title}</span>
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#070b14] border-b border-border/70">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-40" />
        <div className="absolute inset-0 opacity-80">
          <Image
            src={heroBackdropSrc}
            alt={`${movie.title} backdrop`}
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/85 to-[#070b14]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent" />

        <div className="relative z-10 max-w-[1320px] mx-auto px-[5%] py-10 lg:py-12 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-stretch">
          {/* Left cinematic info */}
          <div className="min-h-[470px] flex flex-col justify-end">
            <div className="inline-flex w-fit items-center rounded-md border border-red-500/35 bg-red-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-red-400 uppercase mb-5">
              In Cinemas Now
            </div>
            {heroLeadActor && (
              <div className="text-[11px] text-white/70 tracking-[0.35em] uppercase mb-1">
                Icon Star
              </div>
            )}
            {heroLeadActor && (
              <div className="text-sm tracking-[0.32em] uppercase text-gold/80 mb-4">
                {heroLeadActor}
              </div>
            )}

            <h1 className="font-heading text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-2">
              {movie.title}
            </h1>
            {movie.summary && (
              <p className="text-slate-200/90 text-sm lg:text-[22px] leading-relaxed max-w-2xl mb-6">
                {movie.summary}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {heroGenres.map((g) => (
                <span key={g} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-white/25 bg-black/35 text-white">
                  {g}
                </span>
              ))}
              {movie.runtime_minutes && (
                <span className="text-sm text-slate-100/90 inline-flex items-center pl-1">
                  ◷ {formatRuntime(movie.runtime_minutes)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7 max-w-[760px]">
              {[
                { label:"AI RATING",    val: review?.ai_rating ? `${review.ai_rating.toFixed(1)}/10` : "N/A",          color:"text-gold" },
                { label:"POS. SENTIMENT", val: review?.positive_sentiment ? `${review.positive_sentiment.toFixed(0)}%` : "N/A", color:"text-sentiment-positive" },
                { label:"BOX OFFICE",   val: formatBoxOffice(movie.box_office_inr),                                     color:"text-sentiment-positive" },
                { label:"REACTIONS",    val: review?.reactions_count ? `${(review.reactions_count/1000).toFixed(1)}K+` : "N/A", color:"text-white" },
              ].map((m) => (
                <div key={m.label} className="bg-white/4 border border-border/50 rounded-xl p-3 text-center">
                  <div className="text-[9px] text-muted font-bold tracking-widest uppercase mb-1">{m.label}</div>
                  <div className={cn("font-heading font-bold text-lg leading-none", m.color)}>{m.val}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="#review" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 border border-red-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors">
                ▶ Watch Trailer
              </Link>
              <button className="inline-flex items-center gap-2 bg-black/45 hover:bg-black/65 border border-white/20 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors">
                <Bookmark size={14} /> Add to Watchlist
              </button>
              <button className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/15 text-slate-100 px-4 py-3 rounded-xl font-medium text-sm transition-colors">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Hero Right Rating Panel */}
          {review && (
            <div className="rounded-2xl border border-[#2b3f56] bg-[#07101d]/90 backdrop-blur-md p-5 w-full max-w-[420px] xl:max-w-none mx-auto">
              <div className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase">AI Rating</div>
              <div className="mt-2 flex items-end gap-2">
                <div className="font-heading font-black text-4xl leading-none text-gold">{(review.ai_rating ?? 0).toFixed(1)}</div>
                <div className="text-[11px] font-semibold px-2 py-1 rounded-full border border-gold/25 bg-gold/10 text-gold mb-1">
                  MUST WATCH
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold text-white">High Recommendation</div>
              <div className="mt-2 text-gold tracking-wide">★ ★ ★ ★ ★</div>
              <div className="mt-3 text-xs text-muted leading-relaxed">
                Based on AI Critics, Audience Sentiment &amp; Movie Analysis
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {HERO_SCORE_ITEMS.map(([key, label]) => {
                  const value = review[key] as number | null;
                  if (value === null || value === undefined) return null;
                  return (
                    <div key={key} className="rounded-lg border border-[#1d3248] bg-[#0a1625] px-3 py-2.5">
                      <div className="text-xs text-slate-300">{label}</div>
                      <div className="mt-0.5 font-heading text-[26px] leading-none text-white font-bold">{value.toFixed(1)}</div>
                      <div className="mt-2 h-1 bg-white/8 rounded overflow-hidden">
                        <div className="h-full bg-sentiment-positive rounded" style={{ width: `${value * 10}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/50 bg-white/3 p-2.5 text-center">
                  <div className="text-base">👥</div>
                  <div className="mt-1 text-lg font-heading font-bold text-sentiment-positive">
                    {review.positive_sentiment?.toFixed(0) ?? 0}%
                  </div>
                  <div className="text-[10px] text-muted leading-tight">Audience Sentiment</div>
                  <div className="text-[10px] text-white font-semibold">Positive</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-white/3 p-2.5 text-center">
                  <div className="text-base">📈</div>
                  <div className="mt-1 text-lg font-heading font-bold text-gold">High</div>
                  <div className="text-[10px] text-muted leading-tight">Social Buzz</div>
                  <div className="text-[10px] text-white font-semibold">On the Internet</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-white/3 p-2.5 text-center">
                  <div className="text-base">🔥</div>
                  <div className="mt-1 text-lg font-heading font-bold text-red">#2</div>
                  <div className="text-[10px] text-muted leading-tight">Trending Movie</div>
                  <div className="text-[10px] text-white font-semibold">This Week</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gold/80 font-semibold uppercase tracking-wider">🤖 AI Watch Decision</div>
                  <div className="text-sm font-bold text-gold">MUST WATCH</div>
                </div>
                <ChevronRight size={16} className="text-gold" />
              </div>
              <div className="mt-2 text-[10px] text-muted">AI Rating updated just now</div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <div className="max-w-[1300px] mx-auto px-[5%] py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Sentiment Analysis */}
          {review && (
            <div className="card p-6" id="sentiment">
              <h2 className="font-heading font-bold text-lg mb-5 flex items-center gap-2 before:content-[''] before:w-0.5 before:h-5 before:bg-gold before:rounded">
                AI Sentiment Analysis
              </h2>
              <div className="text-sm text-muted mb-5 leading-relaxed">
                Based on{" "}
                <strong className="text-white">{review.reactions_count?.toLocaleString("en-IN") ?? "0"}+</strong>{" "}
                reactions collected from{" "}
                <strong className="text-white">YouTube</strong> and{" "}
                <strong className="text-white">X (Twitter)</strong>.
              </div>
              <SentimentBar
                positive={review.positive_sentiment ?? 0}
                neutral={review.neutral_sentiment ?? 0}
                negative={review.negative_sentiment ?? 0}
                count={review.reactions_count ?? 0}
                size="lg"
              />
            </div>
          )}

          {/* AI Review */}
          {review?.full_review_text && (
            <div className="card p-6" id="review">
              <h2 className="font-heading font-bold text-lg mb-2 flex items-center gap-2 before:content-[''] before:w-0.5 before:h-5 before:bg-gold before:rounded">
                AI-Generated Review
              </h2>
              <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-gold/5 border border-gold/15 rounded-lg">
                <span className="text-sm">🤖</span>
                <span className="text-xs text-muted">
                  Generated by{" "}
                  <strong className="text-gold">GPT-4.1</strong> · Based on{" "}
                  {review.reactions_count?.toLocaleString("en-IN")} reactions
                </span>
              </div>

              {[
                { title:"📌 Introduction",        body: review.review_intro        },
                { title:"🎬 Plot & Screenplay",    body: review.review_plot         },
                { title:"🎭 Performances",         body: review.review_acting       },
                { title:"🎵 Music & Cinematography", body: review.review_music      },
                { title:"🏆 Final Verdict",        body: review.review_verdict      },
              ].filter(s => s.body).map((s) => (
                <div key={s.title} className="mb-5 last:mb-0">
                  <h3 className="font-heading font-bold text-base mb-2 text-white/90">{s.title}</h3>
                  <p className="text-[#cbd5e1] text-sm leading-[1.85]">{s.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Score Breakdown */}
          {review && (
            <div className="card p-6">
              <h2 className="font-heading font-bold text-lg mb-5 flex items-center gap-2 before:content-[''] before:w-0.5 before:h-5 before:bg-gold before:rounded">
                Score Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCORE_LABELS.map(([key, label]) => {
                  const val = review[key] as number | null;
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-center gap-3 bg-white/3 border border-border/40 rounded-xl p-3">
                      <span className="text-xs text-muted font-medium flex-1">{label}</span>
                      <div className="w-20 bg-white/5 rounded h-1.5 overflow-hidden">
                        <div className="bg-gold h-full rounded" style={{ width:`${val*10}%` }} />
                      </div>
                      <span className="text-gold font-heading font-bold text-sm w-7 text-right">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div className="card p-6" id="cast">
              <h2 className="font-heading font-bold text-lg mb-5 flex items-center gap-2 before:content-[''] before:w-0.5 before:h-5 before:bg-gold before:rounded">
                Cast & Crew
              </h2>
              <div className="flex flex-wrap gap-4">
                {cast.map((c) => (
                  <div key={c.name} className="text-center group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-2 border-border group-hover:border-gold/50 transition-colors flex items-center justify-center text-2xl mx-auto mb-2 overflow-hidden">
                      {c.avatar_url ? (
                        <Image src={c.avatar_url} alt={c.name} width={64} height={64} className="object-cover rounded-full" />
                      ) : (
                        <span>🎭</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold group-hover:text-gold transition-colors max-w-[72px] truncate">{c.name}</div>
                    <div className="text-[10px] text-muted">{c.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {faq.length > 0 && <FAQSection items={faq} />}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-5 lg:sticky lg:top-20">
          {/* Rating Card */}
          {review && (
            <RatingCard
              rating={review.ai_rating ?? 0}
              verdict={review.verdict as Verdict}
              positive={review.positive_sentiment ?? 0}
              neutral={review.neutral_sentiment ?? 0}
              negative={review.negative_sentiment ?? 0}
              reactionsCount={review.reactions_count ?? 0}
              updatedAt={review.updated_at}
            />
          )}

          {/* Movie Details */}
          <div className="card p-5">
            <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2 before:content-[''] before:w-0.5 before:h-4 before:bg-accent before:rounded">
              Movie Details
            </h3>
            <div className="space-y-2.5">
              {[
                ["Release",     formatDate(movie.release_date)       ],
                ["Language",    movie.language                        ],
                ["Runtime",     formatRuntime(movie.runtime_minutes)  ],
                ["Genre",       movie.genre?.slice(0,2).join(", ")    ],
                ["Director",    movie.director                        ],
                ["Producer",    movie.producer                        ],
                ["Music",       movie.music_director                  ],
                ["Box Office",  formatBoxOffice(movie.box_office_inr) ],
                ["OTT",         movie.ott_platform                    ],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-2 border-b border-border/30 last:border-0">
                  <span className="text-muted font-medium">{k}</span>
                  <span className={cn("font-semibold text-right max-w-[150px] truncate",
                    k === "Box Office" ? "text-sentiment-positive" :
                    k === "OTT"        ? "text-gold" : "text-white"
                  )}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
