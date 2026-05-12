// src/components/movie/SentimentBar.tsx
import { cn } from "@/lib/utils";

interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
  count?: number;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function SentimentBar({
  positive,
  neutral,
  negative,
  count,
  showLabels = true,
  size = "md",
  className,
}: SentimentBarProps) {
  const barHeight = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const textSize  = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className={cn("space-y-2.5", className)}>
      {showLabels && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted font-semibold tracking-wider uppercase">
            Audience Sentiment
          </span>
          {count && (
            <span className="text-[10px] text-muted">
              {count.toLocaleString("en-IN")}+ reactions
            </span>
          )}
        </div>
      )}

      {/* Stacked bar */}
      <div className={cn("flex rounded overflow-hidden gap-0.5", barHeight)}>
        <div
          className="bg-sentiment-positive transition-all duration-700"
          style={{ flex: positive }}
          title={`Positive: ${positive}%`}
        />
        <div
          className="bg-gold transition-all duration-700"
          style={{ flex: neutral }}
          title={`Neutral: ${neutral}%`}
        />
        <div
          className="bg-sentiment-negative transition-all duration-700"
          style={{ flex: negative }}
          title={`Negative: ${negative}%`}
        />
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="grid grid-cols-3 gap-2">
          <SentimentItem label="Positive" value={positive} color="text-sentiment-positive" textSize={textSize} />
          <SentimentItem label="Neutral"  value={neutral}  color="text-gold"               textSize={textSize} />
          <SentimentItem label="Negative" value={negative} color="text-sentiment-negative" textSize={textSize} />
        </div>
      )}
    </div>
  );
}

function SentimentItem({
  label,
  value,
  color,
  textSize,
}: {
  label: string;
  value: number;
  color: string;
  textSize: string;
}) {
  return (
    <div className="text-center">
      <div className={cn("font-heading font-bold", color, textSize === "text-sm" ? "text-base" : "text-sm")}>
        {value.toFixed(0)}%
      </div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}