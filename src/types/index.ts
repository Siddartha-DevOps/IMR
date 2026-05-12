// src/types/index.ts
// Core data models matching the Supabase schema exactly

export type Language =
  | "Hindi"
  | "Telugu"
  | "Tamil"
  | "Malayalam"
  | "Kannada"
  | "Bengali"
  | "Marathi";

export type ReleaseType = "Theatrical" | "OTT" | "Both";

export type MovieStatus = "pending" | "processing" | "published" | "failed";

export type Verdict =
  | "Blockbuster"
  | "Super Hit"
  | "Hit"
  | "Average"
  | "Flop"
  | "Disaster";

export type SentimentType = "positive" | "neutral" | "negative";

export type ReactionSource = "YouTube" | "X" | "Reddit" | "Instagram";

export interface CastMember {
  name: string;
  role: string;
  avatar_url?: string;
  role_type?: "Lead" | "Supporting" | "Cameo" | "Special Appearance";
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  original_title?: string;
  language: Language;
  release_date?: string;
  release_type: ReleaseType;
  ott_platform?: string;
  genre?: string[];
  director?: string;
  producer?: string;
  music_director?: string;
  cinematographer?: string;
  cast_members?: CastMember[];
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  runtime_minutes?: number;
  certification?: string;
  box_office_inr?: number;
  tmdb_id?: string;
  imdb_id?: string;
  summary?: string;
  status: MovieStatus;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  movie_id: string;
  ai_rating?: number;
  verdict?: Verdict;
  positive_sentiment?: number;
  neutral_sentiment?: number;
  negative_sentiment?: number;
  reactions_count?: number;
  review_intro?: string;
  review_plot?: string;
  review_acting?: string;
  review_direction?: string;
  review_music?: string;
  review_cinematography?: string;
  review_verdict?: string;
  full_review_text?: string;
  score_story?: number;
  score_acting?: number;
  score_direction?: number;
  score_music?: number;
  score_action?: number;
  score_cinematography?: number;
  score_dialogue?: number;
  score_emotions?: number;
  seo_title?: string;
  meta_description?: string;
  keywords?: string[];
  faq?: FAQItem[];
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  movie_id: string;
  reaction_text: string;
  source: ReactionSource;
  source_url?: string;
  author_handle?: string;
  sentiment_type?: SentimentType;
  sentiment_score?: number;
  likes_count: number;
  created_at: string;
}

export interface Actor {
  id: string;
  name: string;
  slug: string;
  name_native?: string;
  profile_image?: string;
  bio?: string;
  born_date?: string;
  birthplace?: string;
  languages?: string[];
  known_for?: string[];
  total_movies?: number;
  avg_rating?: number;
  created_at: string;
  updated_at: string;
}

// View type — joined movie + review
export interface MovieWithRating extends Movie {
  ai_rating?: number;
  verdict?: Verdict;
  positive_sentiment?: number;
  neutral_sentiment?: number;
  negative_sentiment?: number;
  reactions_count?: number;
  is_published?: boolean;
  published_at?: string;
}

// Full movie detail page type
export interface MovieDetail extends Movie {
  reviews: Review[];
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AgentJobStatus {
  job_type: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}