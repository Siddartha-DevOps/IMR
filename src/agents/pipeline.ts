// src/agents/pipeline.ts
// ─────────────────────────────────────────────────────────────────────────────
// IMR — India Movie Reviews | Complete AI Agent Pipeline
// All 6 agents in one file, orchestrated by Trigger.dev v3
//
// AGENTS:
//   1. detectMoviesTask      — cron every 6h, polls TMDB, triggers pipeline
//   2. collectReactionsTask  — YouTube Data API + X API, 20+ reactions
//   3. analyzeSentimentTask  — GPT-4o batch classifier, computes AI rating
//   4. generateReviewTask    — GPT-4.1 writes 900–1200 word review
//   5. generateSEOTask       — GPT-4.1 generates SEO title, meta, FAQ
//   6. publishPageTask       — Supabase upsert + Next.js ISR revalidation
//
// DEPLOY:
//   npx trigger.dev@latest dev     ← local dev with hot-reload
//   npx trigger.dev@latest deploy  ← production (independent of Vercel)
//
// ENV VARS REQUIRED:
//   OPENAI_API_KEY, SUPABASE_SERVICE_KEY, NEXT_PUBLIC_SUPABASE_URL,
//   TMDB_ACCESS_TOKEN, YOUTUBE_API_KEY, TWITTER_BEARER_TOKEN,
//   NEXT_PUBLIC_SITE_URL, REVALIDATE_TOKEN
// ─────────────────────────────────────────────────────────────────────────────

import { task, schedules, logger } from "@trigger.dev/sdk/v3";
import { ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";
import type { Database } from "@/lib/supabase/database.types";
import type { Language, Verdict, SentimentType, FAQItem } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CLIENTS
// Initialised once, reused across all agents in the same Trigger.dev run
// ─────────────────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!     // service role — bypasses RLS
  );
}

function getLLM(model: "gpt-4o" | "gpt-4-1", temperature = 0.3) {
  return new ChatOpenAI({
    modelName: model,
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxRetries: 2,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — pipeline data shapes
// ─────────────────────────────────────────────────────────────────────────────

interface DetectedMovie {
  tmdb_id: string;
  title: string;
  slug: string;
  language: Language;
  release_date: string | null;
  genre: string[];
  director: string;
  runtime_minutes: number;
  poster_url: string;
  backdrop_url: string;
  summary: string;
}

interface RawReaction {
  text: string;
  source: "YouTube" | "X";
  author_handle: string;
  likes_count: number;
  source_url?: string;
}

interface SentimentResult {
  positive: number;       // percentage 0–100
  neutral: number;
  negative: number;
  ai_rating: number;      // 0–10, 1 decimal
  verdict: Verdict;
  analyzed_count: number;
}

interface ReviewSections {
  intro: string;
  plot: string;
  acting: string;
  direction: string;
  music: string;
  audience_summary: string;
  final_verdict: string;
  full_text: string;
  scores: {
    story: number; acting: number; direction: number; music: number;
    action: number; cinematography: number; dialogue: number; emotions: number;
  };
}

interface SEOData {
  seo_title: string;
  meta_description: string;
  keywords: string[];
  slug: string;
  faq: FAQItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, Language> = {
  te: "Telugu", ta: "Tamil", hi: "Hindi",
  ml: "Malayalam", kn: "Kannada", bn: "Bengali", mr: "Marathi",
};

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function computeAIRating(positive: number, negative: number): number {
  const base    = (positive / 100) * 8.0;
  const penalty = (negative / 100) * 2.0;
  const bonus   = positive > 85 ? 1.5 : positive > 75 ? 0.7 : 0;
  return Math.round(Math.min(10, Math.max(0, base - penalty + bonus)) * 10) / 10;
}

function assignVerdict(rating: number): Verdict {
  if (rating >= 8.5) return "Blockbuster";
  if (rating >= 7.5) return "Super Hit";
  if (rating >= 6.5) return "Hit";
  if (rating >= 5.0) return "Average";
  if (rating >= 3.0) return "Flop";
  return "Disaster";
}

function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

async function logAgentJob(
  job_type: string,
  movie_id: string | null,
  status: "running" | "completed" | "failed",
  metadata?: Record<string, unknown>,
  error?: string
) {
  try {
    const supabase = getSupabase();
    await supabase.from("agent_jobs").insert({
      job_type,
      movie_id,
      status,
      metadata: metadata ?? null,
      error_message: error ?? null,
      started_at:    status === "running"    ? new Date().toISOString() : null,
      completed_at:  status !== "running"    ? new Date().toISOString() : null,
      trigger_type:  "cron",
    });
  } catch {
    // Non-fatal — don't let logging failure stop the pipeline
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 1 — MOVIE DETECTION
// Trigger.dev schedules.task — runs automatically every 6 hours
// Polls TMDB for new Indian films, saves to DB, triggers master pipeline
// ─────────────────────────────────────────────────────────────────────────────

export const detectMoviesTask = schedules.task({
  id:          "imr-detect-movies",
  cron:        "0 */6 * * *",   // every 6 hours: 00:00, 06:00, 12:00, 18:00 UTC
  maxDuration: 300,              // 5 min max

  run: async () => {
    logger.info("[Agent 1] Movie detection started");
    await logAgentJob("movie_detection", null, "running");
    const supabase    = getSupabase();
    const detected: DetectedMovie[] = [];
    const TMDB_BASE   = "https://api.themoviedb.org/3";
    const authHeader  = { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` };

    // Poll now_playing + upcoming for each Indian language
    for (const [code, langName] of Object.entries(LANG_MAP)) {
      for (const endpoint of ["now_playing", "upcoming"]) {
        let page = 1;
        const maxPages = 3;

        while (page <= maxPages) {
          try {
            const { data } = await axios.get(`${TMDB_BASE}/movie/${endpoint}`, {
              headers: authHeader,
              params: { with_original_language: code, region: "IN", page },
            });

            const movies = (data?.results ?? []) as Array<{ id: number }>;
            if (!movies.length) break;

            for (const movie of movies) {
              // Skip if already in DB
              const { data: existing } = await supabase
                .from("movies")
                .select("id")
                .eq("tmdb_id", String(movie.id))
                .maybeSingle();
              if (existing) continue;

              // Fetch full details + credits
              const { data: details } = await axios.get(
                `${TMDB_BASE}/movie/${movie.id}`,
                { headers: authHeader, params: { append_to_response: "credits" } }
              );

              if (!details || LANG_MAP[details.original_language] !== langName) continue;

              const director = (details.credits?.crew ?? [])
                .find((c: { job: string; name: string }) => c.job === "Director")?.name ?? "Unknown";

              detected.push({
                tmdb_id:         String(movie.id),
                title:            details.title,
                slug:             toSlug(details.title),
                language:         langName,
                release_date:     details.release_date || null,
                genre:            (details.genres ?? []).map((g: { name: string }) => g.name),
                director,
                runtime_minutes:  details.runtime ?? 0,
                poster_url:       details.poster_path
                  ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                  : "",
                backdrop_url:     details.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
                  : "",
                summary:          details.overview ?? "",
              });
            }
            page++;
          } catch (err) {
            logger.warn(`[Agent 1] TMDB fetch failed for ${code}/${endpoint}/page${page}`, { err });
            break;
          }
        }
      }
    }

    logger.info(`[Agent 1] Found ${detected.length} new movies`);

    // Save new movies to Supabase
    if (detected.length > 0) {
      const { error } = await supabase.from("movies").upsert(
        detected.map((m) => ({ ...m, status: "pending" as const })),
        { onConflict: "tmdb_id", ignoreDuplicates: true }
      );
      if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    // Trigger full pipeline for each new movie
    let triggered = 0;
    for (const movie of detected) {
      const { data: saved } = await supabase
        .from("movies")
        .select("id")
        .eq("tmdb_id", movie.tmdb_id)
        .single();

      if (saved?.id) {
        await runMoviePipelineTask.trigger(
          { movieId: saved.id },
          { tags: ["auto-detect", movie.language.toLowerCase()] }
        );
        triggered++;
      }
    }

    await logAgentJob("movie_detection", null, "completed", { detected: detected.length, triggered });
    logger.info(`[Agent 1] Done — ${triggered} pipelines triggered`);
    return { detected: detected.length, triggered };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MASTER PIPELINE ORCHESTRATOR
// Chains agents 2 → 3 → 4 → 5 → 6 using triggerAndWait (sequential)
// Can be triggered by Agent 1 (auto) or manually via /api/trigger
// ─────────────────────────────────────────────────────────────────────────────

export const runMoviePipelineTask = task({
  id:          "imr-run-movie-pipeline",
  maxDuration: 900,              // 15 min max for the full chain

  run: async (payload: { movieId: string }) => {
    const { movieId } = payload;
    logger.info(`[Pipeline] Starting for movie ${movieId}`);

    const supabase = getSupabase();
    await supabase
      .from("movies")
      .update({ status: "processing" })
      .eq("id", movieId);

    try {
      // ── Step 1: Collect reactions ──────────────────────────
      const { output: reactionOutput } = await collectReactionsTask.triggerAndWait(
        { movieId },
        { tags: [`movie-${movieId}`] }
      );

      // ── Step 2: Analyze sentiment ──────────────────────────
      const { output: sentimentOutput } = await analyzeSentimentTask.triggerAndWait(
        { movieId, reactions: reactionOutput.reactions }
      );

      // ── Step 3: Generate review ────────────────────────────
      const { output: reviewOutput } = await generateReviewTask.triggerAndWait(
        { movieId, sentiment: sentimentOutput.sentiment }
      );

      // ── Step 4: Generate SEO ───────────────────────────────
      const { output: seoOutput } = await generateSEOTask.triggerAndWait(
        { movieId, reviewText: reviewOutput.review.full_text }
      );

      // ── Step 5: Publish ────────────────────────────────────
      const { output: publishOutput } = await publishPageTask.triggerAndWait({
        movieId,
        sentiment: sentimentOutput.sentiment,
        review:    reviewOutput.review,
        seo:       seoOutput.seo,
      });

      logger.info(`[Pipeline] ✅ Complete — /movies/${publishOutput.slug}`);
      return { success: true, slug: publishOutput.slug };

    } catch (err: any) {
      logger.error(`[Pipeline] ❌ Failed for movie ${movieId}`, { err });
      await supabase
        .from("movies")
        .update({ status: "failed" })
        .eq("id", movieId);
      throw err;
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 2 — REACTION COLLECTOR
// YouTube Data API v3 (comment threads) + X API v2 (recent tweets)
// Minimum 20 reactions per movie, saved to reactions table
// ─────────────────────────────────────────────────────────────────────────────

export const collectReactionsTask = task({
  id:          "imr-collect-reactions",
  maxDuration: 120,

  run: async (payload: { movieId: string }) => {
    const { movieId } = payload;
    await logAgentJob("reaction_collection", movieId, "running");
    const supabase = getSupabase();

    const { data: movie, error } = await supabase
      .from("movies")
      .select("title, language")
      .eq("id", movieId)
      .single();
    if (error || !movie) throw new Error(`Movie ${movieId} not found`);

    logger.info(`[Agent 2] Collecting reactions for "${movie.title}"`);
    const reactions: RawReaction[] = [];

    // ── YouTube Data API ────────────────────────────────────────
    try {
      // 1. Search for the movie's trailer / review videos
      const searchRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            key:               process.env.YOUTUBE_API_KEY,
            q:                 `${movie.title} ${movie.language} movie review trailer`,
            type:              "video",
            maxResults:        5,
            order:             "relevance",
            relevanceLanguage: "en",
            regionCode:        "IN",
            videoDuration:     "medium",
          },
        }
      );

      const videoIds: string[] = (searchRes.data?.items ?? [])
        .map((v: { id: { videoId: string } }) => v.id.videoId)
        .filter(Boolean)
        .slice(0, 3);

      // 2. Fetch top comments for each video
      for (const videoId of videoIds) {
        try {
          const commentsRes = await axios.get(
            "https://www.googleapis.com/youtube/v3/commentThreads",
            {
              params: {
                key:        process.env.YOUTUBE_API_KEY,
                videoId,
                maxResults: 30,
                order:      "relevance",
                textFormat: "plainText",
              },
            }
          );

          for (const item of commentsRes.data?.items ?? []) {
            const c = item.snippet.topLevelComment.snippet;
            const text: string = c.textDisplay ?? "";
            if (text.length >= 15 && text.length <= 500) {
              reactions.push({
                text,
                source:        "YouTube",
                author_handle: c.authorDisplayName ?? "unknown",
                likes_count:   c.likeCount ?? 0,
                source_url:    `https://youtube.com/watch?v=${videoId}&lc=${item.id}`,
              });
            }
          }
        } catch (err) {
          logger.warn(`[Agent 2] YouTube comments failed for video ${videoId}`, { err });
        }
        if (reactions.length >= 30) break;
      }
    } catch (err) {
      logger.warn("[Agent 2] YouTube search failed", { err });
    }

    // ── X (Twitter) API v2 ──────────────────────────────────────
    try {
      const query = `"${movie.title}" movie -is:retweet -is:reply lang:en`;
      const tweetsRes = await axios.get(
        "https://api.twitter.com/2/tweets/search/recent",
        {
          headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
          params: {
            query,
            max_results:   20,
            "tweet.fields": "public_metrics,author_id,created_at",
          },
        }
      );

      for (const tweet of tweetsRes.data?.data ?? []) {
        const text: string = tweet.text ?? "";
        if (text.length >= 15) {
          reactions.push({
            text:          text.slice(0, 500),
            source:        "X",
            author_handle: tweet.author_id,
            likes_count:   tweet.public_metrics?.like_count ?? 0,
            source_url:    `https://x.com/i/web/status/${tweet.id}`,
          });
        }
      }
    } catch (err) {
      // X API errors are common (rate limits, tier issues) — continue with YouTube data
      logger.warn("[Agent 2] X API failed (non-fatal)", { err });
    }

    logger.info(`[Agent 2] Collected ${reactions.length} reactions`);

    if (reactions.length < 5) {
      throw new Error(
        `Only ${reactions.length} reactions collected for "${movie.title}" — minimum is 5. ` +
        `Check YOUTUBE_API_KEY and TWITTER_BEARER_TOKEN.`
      );
    }

    // Save to Supabase reactions table
    const { error: insertError } = await supabase.from("reactions").insert(
      reactions.map((r) => ({
        movie_id:      movieId,
        reaction_text: r.text,
        source:        r.source,
        author_handle: r.author_handle,
        likes_count:   r.likes_count,
        source_url:    r.source_url ?? null,
      }))
    );
    if (insertError) throw new Error(`Failed to save reactions: ${insertError.message}`);

    await logAgentJob("reaction_collection", movieId, "completed", { count: reactions.length });
    return { reactions };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 3 — SENTIMENT ANALYZER
// GPT-4o classifies each reaction as positive / neutral / negative
// Processed in batches of 10 to stay within token limits
// Falls back to keyword matching if GPT fails
// ─────────────────────────────────────────────────────────────────────────────

export const analyzeSentimentTask = task({
  id:          "imr-analyze-sentiment",
  maxDuration: 180,

  run: async (payload: { movieId: string; reactions: RawReaction[] }) => {
    const { movieId, reactions } = payload;
    await logAgentJob("sentiment_analysis", movieId, "running");

    const llm     = getLLM("gpt-4o", 0.0);   // zero temp for deterministic classification
    const labels: SentimentType[] = [];
    const BATCH   = 10;

    logger.info(`[Agent 3] Classifying ${reactions.length} reactions`);

    for (let i = 0; i < reactions.length; i += BATCH) {
      const batch = reactions.slice(i, i + BATCH);
      const numbered = batch
        .map((r, idx) => `${idx + 1}. "${r.text.replace(/"/g, "'")}"`)
        .join("\n");

      const prompt = `Classify each movie audience reaction as positive, neutral, or negative.
Return ONLY a JSON array in order, e.g. ["positive","negative","neutral"].
No explanation. No markdown. Just the JSON array.

Reactions:
${numbered}`;

      try {
        const response  = await llm.invoke(prompt);
        const content   = response.content as string;
        const parsed    = safeParseJSON<SentimentType[]>(content, []);

        if (Array.isArray(parsed) && parsed.length === batch.length) {
          labels.push(...parsed);
        } else {
          // GPT returned wrong count — fall back for this batch
          labels.push(...keywordFallback(batch));
        }
      } catch {
        labels.push(...keywordFallback(batch));
      }
    }

    // Update reactions table with sentiment labels
    for (let i = 0; i < reactions.length; i++) {
      const supabase = getSupabase();
      await supabase
        .from("reactions")
        .update({ sentiment_type: labels[i] ?? "neutral" })
        .eq("movie_id", movieId)
        .is("sentiment_type", null)
        .limit(1);
    }

    // Calculate percentages
    const total    = labels.length;
    const posCount = labels.filter((l) => l === "positive").length;
    const neuCount = labels.filter((l) => l === "neutral").length;
    const negCount = labels.filter((l) => l === "negative").length;

    const positive = Math.round((posCount / total) * 1000) / 10;
    const neutral  = Math.round((neuCount / total) * 1000) / 10;
    const negative = Math.round((negCount / total) * 1000) / 10;

    const ai_rating = computeAIRating(positive, negative);
    const verdict   = assignVerdict(ai_rating);

    const sentiment: SentimentResult = {
      positive, neutral, negative,
      ai_rating, verdict,
      analyzed_count: total,
    };

    logger.info("[Agent 3] Sentiment", sentiment);
    await logAgentJob("sentiment_analysis", movieId, "completed", { ...sentiment });
    return { sentiment };
  },
});

// Keyword fallback when GPT classification fails
function keywordFallback(reactions: RawReaction[]): SentimentType[] {
  const POS = ["amazing","brilliant","superb","love","excellent","fantastic","must watch",
               "blockbuster","masterpiece","fire","outstanding","incredible","best","wow",
               "perfect","goosebumps","mind-blowing","genius","legendary","epic"];
  const NEG = ["waste","boring","bad","terrible","worst","disappoint","flop","trash",
               "awful","hate","skip","overrated","pathetic","disaster","poor","worst"];

  return reactions.map((r) => {
    const t   = r.text.toLowerCase();
    const pos = POS.filter((w) => t.includes(w)).length;
    const neg = NEG.filter((w) => t.includes(w)).length;
    return pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 4 — REVIEW GENERATOR
// GPT-4.1 writes a full 900–1200 word structured review
// Returns JSON with 7 sections + 8 category scores
// ─────────────────────────────────────────────────────────────────────────────

export const generateReviewTask = task({
  id:          "imr-generate-review",
  maxDuration: 180,

  run: async (payload: { movieId: string; sentiment: SentimentResult }) => {
    const { movieId, sentiment } = payload;
    await logAgentJob("review_generation", movieId, "running");

    const supabase = getSupabase();
    const { data: movie } = await supabase
      .from("movies")
      .select("*")
      .eq("id", movieId)
      .single();
    if (!movie) throw new Error(`Movie ${movieId} not found`);

    // Fetch top reactions for context
    const { data: topReactions } = await supabase
      .from("reactions")
      .select("reaction_text, sentiment_type")
      .eq("movie_id", movieId)
      .order("likes_count", { ascending: false })
      .limit(10);

    const reactionsContext = (topReactions ?? [])
      .map((r) => `[${r.sentiment_type ?? "unknown"}] "${r.reaction_text}"`)
      .join("\n");

    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "Unknown";

    const prompt = `You are a professional Indian film critic for IMR (India Movie Reviews).
Write a comprehensive, engaging review for the film described below.

FILM: "${movie.title}" (${movie.language}, ${year})
Director: ${movie.director ?? "Unknown"}
Genre: ${Array.isArray(movie.genre) ? movie.genre.join(", ") : "Unknown"}
Runtime: ${movie.runtime_minutes ? `${Math.floor(movie.runtime_minutes / 60)}h ${movie.runtime_minutes % 60}m` : "Unknown"}
Summary: ${movie.summary ?? "No summary available"}

AUDIENCE SENTIMENT (from ${sentiment.analyzed_count} real reactions):
- AI Rating: ${sentiment.ai_rating}/10
- Positive: ${sentiment.positive}%
- Neutral: ${sentiment.neutral}%
- Negative: ${sentiment.negative}%
- Verdict: ${sentiment.verdict}

SAMPLE AUDIENCE REACTIONS:
${reactionsContext || "No reactions available"}

INSTRUCTIONS:
- Write in an engaging, professional but accessible tone
- Total word count: 900–1200 words across all sections
- Reference audience sentiment naturally — do not just repeat numbers
- No major plot spoilers
- Be honest — if sentiment is mixed, reflect that

Return ONLY valid JSON in this exact structure (no markdown, no preamble):
{
  "intro": "2-3 paragraphs (200-250 words) — hook, context, why this film matters",
  "plot": "Plot overview without spoilers (150-200 words)",
  "acting": "Acting analysis — leads and supporting cast (120-150 words)",
  "direction": "Direction, screenplay, pacing (120-150 words)",
  "music": "Music, background score, sound design (100-120 words)",
  "audience_summary": "What the audience is saying — quote sample reactions naturally (100-120 words)",
  "final_verdict": "Strong closing verdict with recommendation (120-150 words)",
  "scores": {
    "story": 8.5,
    "acting": 9.0,
    "direction": 8.8,
    "music": 9.2,
    "action": 9.0,
    "cinematography": 8.5,
    "dialogue": 8.8,
    "emotions": 8.0
  }
}`;

    const llm      = getLLM("gpt-4-1", 0.7);
    const response = await llm.invoke(prompt);
    const content  = response.content as string;

    type ReviewJSON = {
      intro: string; plot: string; acting: string; direction: string;
      music: string; audience_summary: string; final_verdict: string;
      scores: ReviewSections["scores"];
    };

    const parsed = safeParseJSON<ReviewJSON | null>(content, null);
    if (!parsed) {
      throw new Error("GPT-4.1 returned invalid JSON for the review. Retrying...");
    }

    const full_text = [
      parsed.intro, parsed.plot, parsed.acting, parsed.direction,
      parsed.music, parsed.audience_summary, parsed.final_verdict,
    ].join("\n\n");

    const wordCount = full_text.split(/\s+/).length;
    logger.info(`[Agent 4] Review generated — ${wordCount} words`);

    const review: ReviewSections = { ...parsed, full_text };

    await logAgentJob("review_generation", movieId, "completed", { wordCount });
    return { review };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 5 — SEO GENERATOR
// GPT-4.1 generates SEO title, meta description, 12 keywords, slug, 5 FAQs
// ─────────────────────────────────────────────────────────────────────────────

export const generateSEOTask = task({
  id:          "imr-generate-seo",
  maxDuration: 60,

  run: async (payload: { movieId: string; reviewText: string }) => {
    const { movieId, reviewText } = payload;
    await logAgentJob("seo_generation", movieId, "running");

    const supabase = getSupabase();
    const { data: movie } = await supabase
      .from("movies")
      .select("title, language, director, genre, release_date, ai_rating")
      .eq("id", movieId)
      .single();
    if (!movie) throw new Error(`Movie ${movieId} not found`);

    const year  = movie.release_date ? new Date(movie.release_date).getFullYear() : "2024";
    const genre = Array.isArray(movie.genre) ? movie.genre[0] : "Movie";

    const prompt = `Generate SEO metadata for an Indian movie review page.
Return ONLY valid JSON — no markdown, no preamble.

Movie: "${movie.title}" (${movie.language}, ${year})
Director: ${movie.director ?? "Unknown"}
Genre: ${genre}
Review excerpt (first 300 chars): "${reviewText.slice(0, 300)}..."

Return this exact JSON structure:
{
  "seo_title": "Title under 60 chars — include movie name, AI rating fraction, and year",
  "meta_description": "Under 155 chars — compelling summary mentioning AI rating and verdict",
  "keywords": ["keyword1", "keyword2", "...12 keywords total — mix of head terms and long-tail"],
  "slug": "movie-title-review-year",
  "faq": [
    {"q": "Is ${movie.title} worth watching?", "a": "2-3 sentence answer based on the review"},
    {"q": "What is the AI rating for ${movie.title}?", "a": "Explain the rating and methodology"},
    {"q": "Is ${movie.title} available on OTT?", "a": "Answer about streaming availability"},
    {"q": "How does ${movie.title} compare to the director's earlier films?", "a": "Comparative analysis"},
    {"q": "What do audiences say about ${movie.title}?", "a": "Summary of public reaction"}
  ]
}

SEO requirements:
- Primary keyword: "${movie.title} review"
- Secondary keywords: "${movie.title} ${movie.language}", "${movie.title} AI rating"
- Include year in title for freshness signal
- FAQs must be answerable from the review — no speculation`;

    const llm      = getLLM("gpt-4-1", 0.3);
    const response = await llm.invoke(prompt);
    const content  = response.content as string;

    const parsed = safeParseJSON<SEOData | null>(content, null);

    // Fallback SEO if GPT fails
    const seo: SEOData = parsed ?? {
      seo_title:        `${movie.title} Review: AI Rating ${year} | IMR`,
      meta_description: `AI-powered review of ${movie.title}. Real-time audience sentiment analysis.`,
      keywords:         [movie.title, movie.language, "movie review", "AI rating", `${movie.title} review`],
      slug:             `${toSlug(movie.title)}-review`,
      faq:              [],
    };

    logger.info(`[Agent 5] SEO generated — slug: ${seo.slug}`);
    await logAgentJob("seo_generation", movieId, "completed", { slug: seo.slug });
    return { seo };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 6 — PUBLISHER
// 1. Upserts the full review into Supabase reviews table
// 2. Updates movies.slug and movies.status = "published"
// 3. Calls POST /api/revalidate to trigger Next.js ISR
//    → The page goes LIVE without any Vercel redeploy
// ─────────────────────────────────────────────────────────────────────────────

export const publishPageTask = task({
  id:          "imr-publish-page",
  maxDuration: 60,

  run: async (payload: {
    movieId:   string;
    sentiment: SentimentResult;
    review:    ReviewSections;
    seo:       SEOData;
  }) => {
    const { movieId, sentiment, review, seo } = payload;
    await logAgentJob("publishing", movieId, "running");
    const supabase = getSupabase();

    // ── 1. Upsert review into Supabase ──────────────────────
    const { error: reviewError } = await supabase
      .from("reviews")
      .upsert(
        {
          movie_id:              movieId,
          ai_rating:             sentiment.ai_rating,
          verdict:               sentiment.verdict,
          positive_sentiment:    sentiment.positive,
          neutral_sentiment:     sentiment.neutral,
          negative_sentiment:    sentiment.negative,
          reactions_count:       sentiment.analyzed_count,
          review_intro:          review.intro,
          review_plot:           review.plot,
          review_acting:         review.acting,
          review_direction:      review.direction,
          review_music:          review.music,
          review_verdict:        review.final_verdict,
          full_review_text:      review.full_text,
          score_story:           review.scores.story,
          score_acting:          review.scores.acting,
          score_direction:       review.scores.direction,
          score_music:           review.scores.music,
          score_action:          review.scores.action,
          score_cinematography:  review.scores.cinematography,
          score_dialogue:        review.scores.dialogue,
          score_emotions:        review.scores.emotions,
          seo_title:             seo.seo_title,
          meta_description:      seo.meta_description,
          keywords:              seo.keywords,
          faq:                   seo.faq,
          is_published:          true,
          published_at:          new Date().toISOString(),
          model_used:            "gpt-4-1",
        },
        { onConflict: "movie_id" }
      );

    if (reviewError) {
      throw new Error(`Failed to save review: ${reviewError.message}`);
    }

    // ── 2. Update movie record ───────────────────────────────
    await supabase
      .from("movies")
      .update({ slug: seo.slug, status: "published" })
      .eq("id", movieId);

    // ── 3. Trigger Next.js ISR revalidation ─────────────────
    // This makes the page go LIVE instantly, no redeploy needed
    try {
      const revalidateUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`;
      await axios.post(
        revalidateUrl,
        { slug: seo.slug },
        {
          headers: {
            "Content-Type":       "application/json",
            "x-revalidate-token": process.env.REVALIDATE_TOKEN,
          },
          timeout: 10_000,
        }
      );
      logger.info(`[Agent 6] ✅ Revalidated — /movies/${seo.slug} is now live`);
    } catch (err) {
      // Non-fatal — ISR will pick it up on next request anyway
      logger.warn("[Agent 6] ISR revalidation failed (non-fatal)", {
        slug: seo.slug,
        err: err instanceof AxiosError ? err.message : err,
      });
    }

    await logAgentJob("publishing", movieId, "completed", { slug: seo.slug });
    logger.info(`[Agent 6] ✅ Published: /movies/${seo.slug}`);
    return { slug: seo.slug, publishedAt: new Date().toISOString() };
  },
});