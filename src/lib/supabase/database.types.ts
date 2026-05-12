// src/lib/supabase/database.types.ts
// Auto-generated via: npx supabase gen types typescript --project-id YOUR_ID > src/lib/supabase/database.types.ts
// Run that command after setting up your Supabase project.
// This stub is here so the project compiles before generation.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string;
          title: string;
          slug: string;
          original_title: string | null;
          language: string;
          release_date: string | null;
          release_type: string;
          ott_platform: string | null;
          genre: string[] | null;
          director: string | null;
          producer: string | null;
          music_director: string | null;
          cinematographer: string | null;
          cast_members: Json | null;
          poster_url: string | null;
          backdrop_url: string | null;
          trailer_url: string | null;
          runtime_minutes: number | null;
          certification: string | null;
          box_office_inr: number | null;
          tmdb_id: string | null;
          imdb_id: string | null;
          summary: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["movies"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["movies"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          movie_id: string;
          ai_rating: number | null;
          verdict: string | null;
          positive_sentiment: number | null;
          neutral_sentiment: number | null;
          negative_sentiment: number | null;
          reactions_count: number | null;
          review_intro: string | null;
          review_plot: string | null;
          review_acting: string | null;
          review_direction: string | null;
          review_music: string | null;
          review_cinematography: string | null;
          review_verdict: string | null;
          full_review_text: string | null;
          score_story: number | null;
          score_acting: number | null;
          score_direction: number | null;
          score_music: number | null;
          score_action: number | null;
          score_cinematography: number | null;
          score_dialogue: number | null;
          score_emotions: number | null;
          seo_title: string | null;
          meta_description: string | null;
          keywords: string[] | null;
          faq: Json | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      reactions: {
        Row: {
          id: string;
          movie_id: string;
          reaction_text: string;
          source: string;
          source_url: string | null;
          author_handle: string | null;
          sentiment_type: string | null;
          sentiment_score: number | null;
          likes_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reactions"]["Insert"]>;
      };
      actors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          name_native: string | null;
          profile_image: string | null;
          bio: string | null;
          born_date: string | null;
          birthplace: string | null;
          languages: string[] | null;
          known_for: string[] | null;
          total_movies: number | null;
          avg_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["actors"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["actors"]["Insert"]>;
      };
    };
    Views: {
      v_movies_with_ratings: {
        Row: {
          id: string;
          title: string;
          slug: string;
          language: string;
          release_date: string | null;
          release_type: string;
          ott_platform: string | null;
          genre: string[] | null;
          director: string | null;
          poster_url: string | null;
          runtime_minutes: number | null;
          ai_rating: number | null;
          verdict: string | null;
          positive_sentiment: number | null;
          neutral_sentiment: number | null;
          negative_sentiment: number | null;
          reactions_count: number | null;
          is_published: boolean | null;
          published_at: string | null;
        };
      };
    };
    Functions: {
      compute_ai_rating: {
        Args: { p_positive: number; p_neutral: number; p_negative: number };
        Returns: number;
      };
      assign_verdict: {
        Args: { p_rating: number };
        Returns: string;
      };
    };
  };
}