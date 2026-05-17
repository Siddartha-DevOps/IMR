"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieWithRating } from "@/types";
import AIRatingCard from "@/components/home/AIRatingCard";

export interface HeroMovie extends MovieWithRating {
  ai_rating: number;
  positive_sentiment: number;
  neutral_sentiment: number;
  negative_sentiment: number;
  reactions_count: number;
}

interface Props {
  movies: HeroMovie[];
  featuredMovies?: HeroMovie[];
}

const FEATURED_FALLBACK = [
  { title: "Pushpa 2: The Rule", rating: 8.4, image: "/movies/pushpa2.png" },
  { title: "KALKI 2898 AD", rating: 8.2, image: "/movies/pushpa2.png" },
  { title: "Devara Part 1", rating: 7.8, image: "/movies/pushpa2.png" },
  { title: "Stree 2", rating: 7.6, image: "/movies/pushpa2.png" },
  { title: "Jigra", rating: 7.5, image: "/movies/pushpa2.png" },
  { title: "Venom: The Last Dance", rating: 7.4, image: "/movies/pushpa2.png" },
  { title: "Singham Again", rating: 7.3, image: "/movies/pushpa2.png" },
  { title: "Bhool Bhulaiyaa 3", rating: 7.1, image: "/movies/pushpa2.png" },
  { title: "Gladiator II", rating: 7.0, image: "/movies/pushpa2.png" },
  { title: "The Wild Robot", rating: 6.9, image: "/movies/pushpa2.png" },
];

export default function HeroSection({ movies, featuredMovies }: Props) {
  const movie = movies[0];
  if (!movie) return null;

  const runtime = movie.runtime_minutes
    ? `${Math.floor(movie.runtime_minutes / 60)}h ${movie.runtime_minutes % 60}m`
    : "2h 59m";

  const metrics = [
    { label: "Story", value: 8.2 },
    { label: "Performances", value: 8.6 },
    { label: "Direction", value: 8.3 },
    { label: "Cinematography", value: 8.4 },
    { label: "Music", value: 8.1 },
    { label: "Entertainment", value: 8.7 },
  ];

  const featured = featuredMovies?.length
    ? featuredMovies.slice(0, 10).map((m) => ({
        title: m.title,
        rating: Number((m.ai_rating ?? 0).toFixed(1)),
        image: "/movies/pushpa2.png",
        slug: m.slug,
      }))
    : FEATURED_FALLBACK;

  return (
    <section className="bg-black text-white">
      <div className="relative h-[80vh] min-h-[620px] border-b border-white/10">
        <Image
          src="/movies/pushpa2.png"
          alt="Pushpa 2"
          fill
          priority
          className="object-cover object-center brightness-[0.92]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/35 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        <div className="relative z-10 mx-auto h-full max-w-[1540px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6 items-stretch">
          <div className="flex flex-col justify-end pb-2 lg:pb-8">
            <span className="mb-5 inline-flex w-fit rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
              IN CINEMAS NOW
            </span>

            <div className="text-[10px] tracking-[0.4em] text-white/70 uppercase">ICON STAR</div>
            <div className="mt-1 mb-5 text-base tracking-[0.3em] text-yellow-300/85 uppercase">ALLU ARJUN</div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {["Action", "Drama", "Thriller"].map((g) => (
                <span key={g} className="rounded-md border border-white/25 bg-black/30 px-3 py-1.5 text-xs font-medium">
                  {g}
                </span>
              ))}
              <span className="ml-1 text-sm text-white/90">Runtime {runtime}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Pushpa 2: The Rule</h1>
            <p className="mt-4 max-w-3xl text-base text-white/85 leading-relaxed">
              Pushpa Raj is back! The Rule begins as Pushpa rises higher, faces stronger enemies and fights for power, loyalty and his empire.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/movies/${movie.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-lg font-semibold transition-all hover:bg-red-500 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(239,68,68,0.45)]"
              >
                Watch Trailer
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-black/35 px-6 py-3 text-lg font-medium transition-all hover:bg-black/60 hover:scale-[1.02]">
                <Plus size={18} /> Add to Watchlist
              </button>
            </div>
          </div>

          <div className="lg:pl-2 flex items-end lg:items-center">
            <div className="w-full max-w-[440px] lg:ml-auto mt-8 lg:mt-16">
              <AIRatingCard
                rating={8.4}
                verdict="MUST WATCH"
                recommendation="Must Watch"
                audienceSentiment={88}
                socialBuzz="High"
                trendingRank="#1"
                metrics={metrics}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1540px] px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-wide">
            <span className="text-yellow-400"></span> TOP 10 FEATURED REVIEWS
          </h2>
          <div className="hidden md:flex items-center gap-2">
            <button className="rounded-full border border-white/20 bg-white/5 p-2 hover:bg-white/10 transition-colors"><ChevronLeft size={16} /></button>
            <button className="rounded-full border border-white/20 bg-white/5 p-2 hover:bg-white/10 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {featured.map((m, i) => (
            <Link
              key={`${m.title}-${i}`}
              href={"slug" in m && m.slug ? `/movies/${m.slug}` : "/movies"}
              className="group min-w-[170px] max-w-[170px] rounded-xl border border-white/10 bg-[#06090f] overflow-hidden transition-all hover:scale-[1.04] hover:border-yellow-400/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                <Image
                  src="/movies/pushpa2.png"
                  alt="Pushpa 2"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs font-bold leading-none">{i + 1}</div>
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-semibold">{m.title}</div>
                <div className="mt-1 flex items-center gap-1 text-yellow-400"><Star size={14} fill="currentColor" /> <span className="text-lg">{m.rating.toFixed(1)}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
