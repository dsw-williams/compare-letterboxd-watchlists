export interface Movie {
  title: string;
  year: string;
  slug: string;
  director: string | null;
  poster_url: string | null;
  letterboxd_url: string;
  tmdb_id: number | null;
  genres: string[];
  rating: number | null;
  runtime: number | null;
}

export interface WatchedMovie {
  title: string;
  year: string;
  slug: string;
  letterboxd_url: string;
}

export interface Friend {
  username: string;
  avatar_url: string | null;
  watchlist: Movie[];
  watched: WatchedMovie[];
  last_synced: string | null;
  tmdb_enriched: boolean;
}

export interface LetterboxdList {
  id: string; // "{owner}/{slug}"
  name: string;
  owner: string;
  slug: string;
  movies: Movie[];
  last_synced: string | null;
  tmdb_enriched: boolean;
}

export interface Settings {
  tmdb_api_key: string | null;
}
