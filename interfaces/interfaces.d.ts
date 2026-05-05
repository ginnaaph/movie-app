type MediaType = "movie" | "tv";

interface MediaSummary {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  release_date?: string;
  vote_average: number;
}

interface Movie {
  id: number;
  media_type?: "movie";
  title: string;
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface TVShow {
  id: number;
  media_type?: "tv";
  name: string;
  original_name: string;
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
}

interface MovieDetails {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
  } | null;
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  original_language: string;
  original_title: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
}

interface TVDetails {
  adult: boolean;
  backdrop_path: string | null;
  created_by: {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
  }[];
  episode_run_time: number[];
  first_air_date: string;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string | null;
  id: number;
  in_production: boolean;
  languages: string[];
  last_air_date: string | null;
  name: string;
  networks: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  seasons: {
    air_date: string | null;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    vote_average: number;
  }[];
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string | null;
  type: string;
  vote_average: number;
  vote_count: number;
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
}

interface TrendingCardProps {
  movie: TrendingMovie;
  index: number;
}

interface SavedMovieCardProps {
  movie: ListItem;
  index: number;
}

interface TrendingMovie {
  $id: string;
  searchTerm: string;
  count: number;
  movie_id: number;
  media_id?: number;
  media_type?: MediaType;
  title: string;
  poster_url: string;
  saved?: boolean;
  release_date?: string;
  vote_average?: number;
}

interface ListItem {
  $id: string;
  user_id: string;
  list_id: string;
  movie_id: number;
  media_id?: number;
  media_type?: MediaType;
  title: string;
  poster_url: string;
  release_date?: string;
  vote_average?: number;
  added_at: string;
}

interface UserProfile {
  $id: string;
  user_id: string;
  name: string;
  bio: string;
  profile_image_url: string;
}

type ProfileRange = "week" | "month" | "all";

interface MovieList {
  $id: string;
  user_id: string;
  name: string;
  slug: string;
  type: "system" | "custom";
  is_default: boolean;
}

interface ChartBucket {
  label: string;
  value: number;
}

interface ProfileStats {
  saved: number;
  watched: number;
  lists: number;
  range: ProfileRange;
  chart: ChartBucket[];
}

interface WatchHistoryEntry {
  $id: string;
  user_id: string;
  movie_id: number;
  media_id?: number;
  media_type?: MediaType;
  title: string;
  poster_url: string;
  vote_average?: number;
  release_date?: string;
  watched_at: string;
}

interface MovieListStatus {
  saved: boolean;
  watched: boolean;
  watchedListId: string | null;
  customListIds: string[];
}
