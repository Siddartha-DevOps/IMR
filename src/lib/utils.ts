// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Verdict } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return "N/A";
  return rating.toFixed(1);
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return "Unknown";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatBoxOffice(inr: number | null | undefined): string {
  if (!inr) return "Unknown";
  if (inr >= 1_00_00_00_000) return `₹${(inr / 1_00_00_00_000).toFixed(1)}Cr`;
  if (inr >= 1_00_00_000) return `₹${(inr / 1_00_00_000).toFixed(1)}Cr`;
  if (inr >= 1_00_000) return `₹${(inr / 1_00_000).toFixed(1)}L`;
  return `₹${inr.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getVerdictColor(verdict: Verdict | null | undefined): string {
  switch (verdict) {
    case "Blockbuster": return "text-sentiment-positive";
    case "Super Hit":   return "text-sentiment-positive";
    case "Hit":         return "text-gold";
    case "Average":     return "text-muted";
    case "Flop":        return "text-sentiment-negative";
    case "Disaster":    return "text-sentiment-negative";
    default:            return "text-muted";
  }
}

export function getRatingColor(rating: number | null | undefined): string {
  if (!rating) return "text-muted";
  if (rating >= 8) return "text-sentiment-positive";
  if (rating >= 6) return "text-gold";
  if (rating >= 4) return "text-orange-400";
  return "text-sentiment-negative";
}

export function languageToCode(lang: string): string {
  const map: Record<string, string> = {
    Hindi: "HI", Telugu: "TE", Tamil: "TA",
    Malayalam: "ML", Kannada: "KN", Bengali: "BN", Marathi: "MR",
  };
  return map[lang] || lang.slice(0, 2).toUpperCase();
}

export function languageToNative(lang: string): string {
  const map: Record<string, string> = {
    Hindi: "हिन्दी", Telugu: "తెలుగు", Tamil: "தமிழ்",
    Malayalam: "മലയാളം", Kannada: "ಕನ್ನಡ", Bengali: "বাংলা", Marathi: "मराठी",
  };
  return map[lang] || lang;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getStarRating(rating: number): { full: number; half: boolean; empty: number } {
  const scaled = (rating / 10) * 5;
  const full = Math.floor(scaled);
  const half = scaled - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}