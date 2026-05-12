// src/components/movie/RatingCard.tsx
import { cn, formatRating, getStarRating, getVerdictColor } from "@/lib/utils";
import SentimentBar from "./SentimentBar";
import type { Verdict } from "@/types";

interface RatingCardProps {
  rating: number;
  verdict?: Verdict;
  positive: number;
  neutral: number;
  negative: number;
  reactionsCount?: number;
  updatedAt?: string;
  className?: string;
}

export default function RatingCard({
  rating,
  verdict,
  positive,
  neutral,
  negative,
  reactionsCount,
  updatedAt,
  className,
}: RatingCardProps) {
  const { full, half, empty } = getStarRating(rating);

  return (
    <div className={cn("card p-5", className)}>
      {/* Rating header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] text-muted font-bold tracking-widest uppercase mb-1.5">
            AI Rating
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-extrabold text-4xl text-gold leading-none">
              {formatRating(rating)}
            </span>
            <span className="text-muted text-sm font-medium">/ 10</span>
          </div>
          {/* Stars */}
          <div className="flex gap-0.5 mt-2">
            {Array(full).fill(0).map((_, i) => (
              <span key={`f-${i}`} className="text-gold text-sm">★</span>
            ))}
            {half && <span className="text-gold text-sm">½</span>}
            {Array(empty).fill(0).map((_, i) => (
              <span key={`e-${i}`} className="text-muted/40 text-sm">★</span>
            ))}
          </div>
        </div>

        {verdict && (
          <div className={cn(
            "border rounded-full px-3 py-1 text-xs font-bold tracking-wide",
            verdict === "Blockbuster" || verdict === "Super Hit"
              ? "text-sentiment-positive bg-green-500/10 border-green-500/25"
              : verdict === "Hit"
              ? "text-gold bg-yellow-500/10 border-yellow-500/25"
              : "text-muted bg-white/5 border-border"
          )}>
            {verdict.toUpperCase()}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-4" />

      {/* Sentiment */}
      <SentimentBar
        positive={positive}
        neutral={neutral}
        negative={negative}
        count={reactionsCount}
        size="md"
      />

      {/* Footer */}
      {updatedAt && (
        <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted text-center">
          Updated{" "}
          {new Date(updatedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}