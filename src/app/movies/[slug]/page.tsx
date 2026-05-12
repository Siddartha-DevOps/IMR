// src/app/movies/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
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
  getVerdictColor, languageToCode, cn,
} from "@/lib/utils";
import type { MovieDetail, Review, FAQItem, Verdict, CastMember } from "@/types";
import { ChevronRight, Share2, Bookmark } from "lucide-react";

// ISR: revalidate every hour
export const revalidate = 3600;

// Generate all published movie slugs at build time
export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase
    .from("movies")
    .select("slug")
    .eq("status", "published")
    .limit(200);
  return (data ?? []).map((m) => ({ slug: m.slug }));
}

// Dynamic SEO metadata
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const supabase = createClient();
  const { data: movie } = await supabase
    .from("movies")
    .select("*, reviews(*)")
    .eq("slug", params.slug)
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

export default async function MovieReviewPage(
  { params }: { params: { slug: string } }
) {
  const supabase = createClient();

  const { data: movie, error } = await supabase
    .from("movies")
    .select("*, reviews(*)")
    .eq("slug", params.slug)
    .single();

  if (error || !movie) notFound();

  const review = (movie.reviews as Review[])?.[0] ?? null;
  const cast   = (movie.cast_members as CastMember[] | null) ?? [];
  const faq    = (review?.faq    as FAQItem[]  | null) ?? [];
  const year   = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const schema = getMovieSchema(movie as MovieDetail, review);

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
      <div className="relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size" />
        {movie.backdrop_url && (
          <div className="absolute inset-0 opacity-10">
            <Image src={movie.backdrop_url} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />

        <div className="relative z-10 max-w-[1300px] mx-auto px-[5%] py-12 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 items-start">
          {/* Poster */}
          <div className="relative w-[220px] aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex-shrink-0 mx-auto md:mx-0">
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={`${movie.title} poster`}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center text-7xl">
                🎬
              </div>
            )}
            {review?.ai_rating && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-bg/85 backdrop-blur-sm border border-border rounded-xl px-4 py-2 text-center whitespace-nowrap">
                <div className="text-[9px] text-muted font-bold tracking-widest uppercase">AI RATING</div>
                <div className="font-heading font-extrabold text-xl text-gold leading-none mt-0.5">
                  {review.ai_rating.toFixed(1)} ⭐
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Verdict badge */}
            {review?.verdict && (
              <div className={cn(
                "inline-flex items-center gap-1.5 border rounded-full px-4 py-1.5 text-xs font-bold tracking-wide mb-4",
                review.verdict === "Blockbuster" || review.verdict === "Super Hit"
                  ? "text-sentiment-positive bg-green-500/10 border-green-500/25"
                  : "text-gold bg-yellow-500/10 border-yellow-500/25"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {review.verdict.toUpperCase()}
              </div>
            )}

            <h1 className="font-heading text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-2">
              {movie.title}
            </h1>
            {movie.summary && (
              <p className="text-muted text-sm lg:text-base leading-relaxed max-w-2xl mb-5">
                {movie.summary}
              </p>
            )}

            {/* Quick facts */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: languageToCode(movie.language), className: "badge-lang badge-lang-telugu" },
                year && { label: String(year) },
                movie.runtime_minutes && { label: formatRuntime(movie.runtime_minutes) },
                movie.certification && { label: movie.certification },
                movie.director && { label: `Dir: ${movie.director}` },
                ...(movie.genre?.slice(0,2).map(g => ({ label: g })) ?? []),
              ].filter(Boolean).map((f: any, i) => (
                <span key={i} className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-lg border",
                  f.className || "bg-white/5 border-border text-muted"
                )}>
                  {f.label}
                </span>
              ))}
            </div>

            {/* Metrics strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="#review" className="btn-primary text-sm">📖 Read Review</Link>
              <button className="btn-ghost text-sm">▶ Watch Trailer</button>
              <button className="btn-ghost text-sm">
                <Share2 size={14} /> Share
              </button>
              <button className="btn-ghost text-sm">
                <Bookmark size={14} /> Save
              </button>
            </div>
          </div>
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