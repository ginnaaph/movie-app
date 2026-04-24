interface Movie {
  id: number;
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
  title: string;
  poster_url: string;
}

interface ListItem {
  $id: string;
  user_id: string;
  list_id: string;
  movie_id: number;
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
  title: string;
  poster_url: string;
  vote_average?: number;
  release_date?: string;
  watched_at: string;
}

interface MovieListStatus {
  watched: boolean;
  watchedListId: string | null;
  customListIds: string[];
}
