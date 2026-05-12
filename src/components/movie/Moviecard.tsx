"use client";
// src/components/movie/MovieCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn, formatRating, languageToCode } from "@/lib/utils";
import type { MovieWithRating } from "@/types";

interface MovieCardProps {
  movie: MovieWithRating;
  className?: string;
}

const LANG_COLORS: Record<string, string> = {
  Telugu:    "text-purple-300 bg-purple-500/10 border-purple-500/20",
  Hindi:     "text-orange-300 bg-orange-500/10 border-orange-500/20",
  Tamil:     "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Malayalam: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  Kannada:   "text-pink-300 bg-pink-500/10 border-pink-500/20",
};

// Placeholder gradient per language (used when no poster)
const LANG_GRADIENTS: Record<string, string> = {
  Telugu:    "from-purple-900/50 to-indigo-900/50",
  Hindi:     "from-orange-900/50 to-red-900/50",
  Tamil:     "from-emerald-900/50 to-teal-900/50",
  Malayalam: "from-blue-900/50 to-cyan-900/50",
  Kannada:   "from-pink-900/50 to-rose-900/50",
};

export default function MovieCard({ movie, className }: MovieCardProps) {
  const rating = movie.ai_rating;
  const pos = movie.positive_sentiment ?? 0;
  const neu = movie.neutral_sentiment ?? 0;
  const neg = movie.negative_sentiment ?? 0;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const langColor = LANG_COLORS[movie.language] ?? "text-muted bg-white/5 border-border";
  const gradient = LANG_GRADIENTS[movie.language] ?? "from-gray-800/50 to-gray-900/50";

  const isNew = movie.release_date
    ? (Date.now() - new Date(movie.release_date).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Link
      href={`/movies/${movie.slug}`}
      className={cn(
        "block bg-bg-card border border-transparent rounded-[14px] overflow-hidden",
        "transition-all duration-250 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-border",
        "hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group",
        className
      )}
    >
      {/* Poster */}
      <div className={cn("relative aspect-[2/3] bg-gradient-to-br", gradient)}>
        {movie.poster_url ? (
          <Image
            src={movie.poster_url}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-40">🎬</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isNew && (
            <span className="bg-bg/80 backdrop-blur-sm text-gold border border-gold/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
              NEW
            </span>
          )}
          {movie.release_type === "OTT" && (
            <span className="bg-bg/80 backdrop-blur-sm text-blue-400 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
              OTT
            </span>
          )}
        </div>

        {/* Rating badge */}
        {rating && (
          <div className="absolute bottom-2.5 right-2.5 bg-gold/15 backdrop-blur-sm border border-gold/40 rounded-lg px-2 py-1 flex items-center gap-1">
            <span className="text-[10px]">⭐</span>
            <span className="text-gold font-heading font-bold text-sm leading-none">
              {formatRating(rating)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-heading font-semibold text-[15px] text-white mb-1.5 truncate">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mb-2.5">
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded border", langColor)}>
            {languageToCode(movie.language)}
          </span>
          {year && (
            <span className="text-xs text-muted">{year}</span>
          )}
          {movie.runtime_minutes && (
            <span className="text-xs text-muted ml-auto">
              {Math.floor(movie.runtime_minutes / 60)}h{movie.runtime_minutes % 60}m
            </span>
          )}
        </div>

        {/* Sentiment mini bars */}
        {(pos > 0 || neu > 0 || neg > 0) && (
          <div className="flex gap-0.5 h-1 rounded overflow-hidden">
            <div className="bg-sentiment-positive rounded-l" style={{ flex: pos }} />
            <div className="bg-gold" style={{ flex: neu }} />
            <div className="bg-sentiment-negative rounded-r" style={{ flex: neg }} />
          </div>
        )}
      </div>
    </Link>
  );
}