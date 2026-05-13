// src/lib/tmdb.ts
// ─────────────────────────────────────────────────────────────
// TMDB Image Service
//
// HOW MOVIE IMAGES WORK AUTOMATICALLY:
//
//   1. Agent 1 (detectMoviesTask) calls TMDB API every 6 hours
//   2. TMDB returns poster_path e.g. "/abc123.jpg"
//   3. Agent 1 builds full URL: https://image.tmdb.org/t/p/w500/abc123.jpg
//   4. Agent 1 saves poster_url to movies.poster_url in Supabase
//   5. Next.js <Image> renders it from Supabase → TMDB CDN
//   6. Cloudflare caches it globally
//
//   RESULT: Every new movie gets its poster AUTOMATICALLY.
//   You never manually upload a single image.
// ─────────────────────────────────────────────────────────────

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Image size presets — use the smallest that fits your UI
export const TMDB_SIZES = {
  poster: {
    sm:       `${TMDB_IMAGE_BASE}/w185`,   // thumbnail cards
    md:       `${TMDB_IMAGE_BASE}/w342`,   // movie grid cards
    lg:       `${TMDB_IMAGE_BASE}/w500`,   // hero poster
    xl:       `${TMDB_IMAGE_BASE}/w780`,   // large hero
    original: `${TMDB_IMAGE_BASE}/original`,
  },
  backdrop: {
    sm:       `${TMDB_IMAGE_BASE}/w300`,
    md:       `${TMDB_IMAGE_BASE}/w780`,
    lg:       `${TMDB_IMAGE_BASE}/w1280`,
    original: `${TMDB_IMAGE_BASE}/original`,
  },
  profile: {
    sm:       `${TMDB_IMAGE_BASE}/w45`,
    md:       `${TMDB_IMAGE_BASE}/w185`,
    lg:       `${TMDB_IMAGE_BASE}/h632`,
  },
} as const;

/**
 * Build a TMDB image URL from a path stored in the DB.
 * Returns null if path is missing so you can show a placeholder.
 *
 * @example
 * const url = tmdbPosterUrl(movie.poster_url, "md")
 * // → "https://image.tmdb.org/t/p/w342/abc123.jpg"
 */
export function tmdbPosterUrl(
  pathOrUrl: string | null | undefined,
  size: keyof typeof TMDB_SIZES.poster = "md"
): string | null {
  if (!pathOrUrl) return null;

  // Already a full URL (saved by the agent) — return as-is
  if (pathOrUrl.startsWith("http")) return pathOrUrl;

  // Raw TMDB path like "/abc123.jpg" — build full URL
  return `${TMDB_SIZES.poster[size]}${pathOrUrl}`;
}

export function tmdbBackdropUrl(
  pathOrUrl: string | null | undefined,
  size: keyof typeof TMDB_SIZES.backdrop = "lg"
): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${TMDB_SIZES.backdrop[size]}${pathOrUrl}`;
}

/**
 * Blur data URL placeholder shown while poster loads.
 * Same aspect ratio as poster (2:3).
 */
export const POSTER_BLUR_DATA =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAHxAAAQQCAwEAAAAAAAAAAAAAAQIDBAUSITFB/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKbYarEsUWzMuSW4bCFuoB3+4oA9qdA0dQi6hLsRhEiO0f5pSg+klnP/2Q==";

// ── FALLBACK GRADIENT POSTERS ──────────────────────────────────
// Shown when a movie has no poster_url yet (e.g. newly detected, image fetch pending)

const LANG_GRADIENTS: Record<string, string> = {
  Telugu:    "from-purple-950 via-indigo-950 to-slate-950",
  Hindi:     "from-orange-950 via-red-950 to-slate-950",
  Tamil:     "from-emerald-950 via-teal-950 to-slate-950",
  Malayalam: "from-blue-950 via-cyan-950 to-slate-950",
  Kannada:   "from-pink-950 via-rose-950 to-slate-950",
  Bengali:   "from-yellow-950 via-amber-950 to-slate-950",
  English:   "from-slate-900 via-slate-950 to-black",
  default:   "from-slate-900 via-slate-950 to-black",
};

export function posterGradient(language: string): string {
  return LANG_GRADIENTS[language] ?? LANG_GRADIENTS.default;
}

// Emoji fallback per language (shows if no poster)
const LANG_EMOJI: Record<string, string> = {
  Telugu: "🎭", Hindi: "🎬", Tamil: "🎪",
  Malayalam: "🌴", Kannada: "⚡", Bengali: "🎨", English: "🎥",
};

export function posterEmoji(language: string): string {
  return LANG_EMOJI[language] ?? "🎬";
}