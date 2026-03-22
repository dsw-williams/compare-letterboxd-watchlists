export interface Movie {
  slug: string;                 // from Letterboxd — identifier only
  letterboxd_url: string;       // constructed from slug
  title: string;                // from TMDB (fallback: Letterboxd until enriched)
  year: string;                 // from TMDB (fallback: Letterboxd until enriched)
  tmdb_id: number | null;       // null until TMDB enrichment runs
  poster_url: string | null;    // from TMDB
  director: string | null;      // from TMDB (watchlist + favourites only)
  genres: string[];             // from TMDB (watchlist + favourites only)
  rating: number | null;        // from TMDB (watchlist only)
  runtime: number | null;       // from TMDB (watchlist only)
}

export interface Friend {
  username: string;
  custom_name?: string;
  avatar_url: string | null;
  watchlist: Movie[];
  watched: Movie[];
  favourites: Movie[];
  last_synced: string | null;
  enrichment_pending: boolean;
}

export interface LetterboxdList {
  id: string; // "{owner}/{slug}"
  name: string;
  custom_name?: string;
  owner: string;
  slug: string;
  movies: Movie[];
  last_synced: string | null;
  enrichment_pending: boolean;
}

export interface Settings {
  tmdb_api_key: string | null;
}
