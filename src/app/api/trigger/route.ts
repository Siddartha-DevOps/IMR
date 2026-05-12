// src/app/api/trigger/route.ts
// POST /api/trigger
//
// Manually kicks off the full AI pipeline for a specific movie.
// Use this to:
//   - Test the pipeline without waiting for the 6h cron
//   - Re-process a movie that failed
//   - Force-refresh a movie's review
//
// USAGE:
//   curl -X POST https://imr.in/api/trigger \
//     -H "Content-Type: application/json" \
//     -H "x-admin-token: YOUR_ADMIN_TOKEN" \
//     -d '{"tmdb_id": "1064028"}'
//
// Protected by x-admin-token header — never expose this endpoint publicly.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runMoviePipelineTask } from "@/agents/pipeline";

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ── Parse body ────────────────────────────────────────────
  let body: { tmdb_id?: string; movie_id?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { tmdb_id, movie_id, slug } = body;

  if (!tmdb_id && !movie_id && !slug) {
    return NextResponse.json(
      { error: "Provide one of: tmdb_id, movie_id, or slug" },
      { status: 400 }
    );
  }

  // ── Resolve movie ID ──────────────────────────────────────
  const supabase = createServiceClient();
  let resolvedMovieId = movie_id;

  if (!resolvedMovieId) {
    const query = supabase.from("movies").select("id");
    const { data, error } = tmdb_id
      ? await query.eq("tmdb_id", tmdb_id).single()
      : await query.eq("slug", slug!).single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "Movie not found",
          hint: tmdb_id
            ? `No movie with tmdb_id=${tmdb_id}. Run the detection agent first.`
            : `No movie with slug=${slug}`,
        },
        { status: 404 }
      );
    }
    resolvedMovieId = data.id;
  }

  // ── Trigger the pipeline ──────────────────────────────────
  try {
    const handle = await runMoviePipelineTask.trigger(
      { movieId: resolvedMovieId },
      {
        // Tag this run as manual in Trigger.dev dashboard
        tags: ["manual-trigger", `movie-${resolvedMovieId}`],
      }
    );

    return NextResponse.json({
      success: true,
      taskId: handle.id,
      movieId: resolvedMovieId,
      dashboardUrl: `https://cloud.trigger.dev/runs/${handle.id}`,
      message: `Pipeline started. Track progress at the dashboard URL.`,
    });
  } catch (err: any) {
    console.error("[/api/trigger] Failed to trigger pipeline:", err);
    return NextResponse.json(
      { error: "Failed to trigger pipeline", detail: err.message },
      { status: 500 }
    );
  }
}