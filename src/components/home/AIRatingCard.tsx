"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Flame, TrendingUp, Users } from "lucide-react";

interface MetricItem {
  label: string;
  value: number;
}

interface Props {
  rating: number;
  verdict: string;
  recommendation: string;
  audienceSentiment: number;
  socialBuzz: string;
  trendingRank: string;
  metrics: MetricItem[];
}

export default function AIRatingCard({
  rating,
  verdict,
  recommendation,
  audienceSentiment,
  socialBuzz,
  trendingRank,
  metrics,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full rounded-xl border border-[#2a3342] bg-black/70 px-4 py-3 text-left backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-colors hover:bg-black/80"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm md:text-base font-semibold tracking-wide text-white">
            AI RATING <span className="text-yellow-400">{rating.toFixed(1)}</span>{" "}
            <span className="text-white/45">|</span> <span className="text-green-400">{verdict}</span>
          </div>
          {expanded ? (
            <ChevronUp size={18} className="text-white/80" />
          ) : (
            <ChevronDown size={18} className="text-white/80" />
          )}
        </div>
      </button>

      <div
        className={`absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-[#2a3342] bg-black/80 backdrop-blur-xl shadow-[0_22px_60px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out z-20 ${
          expanded ? "max-h-[700px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="p-4 md:p-4.5">
          <div className="text-[11px] font-semibold tracking-wide text-white/90">AI ANALYSIS</div>
          <p className="mt-2 text-sm leading-snug text-white/70">
            Based on AI Critics, Audience Sentiment &amp; Movie Analysis
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-[#1f2a39] bg-[#050d17]/90 p-2.5">
                <div className="text-xs text-white/75">{m.label}</div>
                <div className="mt-0.5 text-[28px] font-bold leading-none">{m.value}</div>
                <div className="mt-1.5 h-1.5 rounded bg-white/10">
                  <div className="h-full rounded bg-green-500" style={{ width: `${m.value * 10}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[#1f2a39] bg-[#050d17]/90 p-2.5">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-blue-400" />
                <span className="text-2xl font-bold leading-none">{audienceSentiment}%</span>
              </div>
              <div className="mt-1 text-xs text-white/70">Audience Sentiment</div>
              <div className="text-xs text-white">Positive</div>
            </div>
            <div className="rounded-lg border border-[#1f2a39] bg-[#050d17]/90 p-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-2xl font-bold leading-none">{socialBuzz}</span>
              </div>
              <div className="mt-1 text-xs text-white/70">Social Buzz</div>
              <div className="text-xs text-white">On the Internet</div>
            </div>
            <div className="rounded-lg border border-[#1f2a39] bg-[#050d17]/90 p-2.5">
              <div className="flex items-center gap-1.5">
                <Flame size={16} className="text-orange-400" />
                <span className="text-2xl font-bold leading-none">{trendingRank}</span>
              </div>
              <div className="mt-1 text-xs text-white/70">Trending Rank</div>
              <div className="text-xs text-white">This Week</div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#2a3b50] bg-[#040b14] px-3.5 py-2.5">
            <div className="text-sm text-white/90">AI Watch Decision</div>
            <div className="flex items-center gap-2 text-green-400 text-lg font-bold">
              {recommendation.toUpperCase()} <ChevronRight size={20} />
            </div>
          </div>
          <div className="mt-2.5 text-center text-xs text-white/50">AI Rating updated just now</div>
        </div>
      </div>
    </div>
  );
}

