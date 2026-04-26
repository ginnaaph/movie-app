export const TMBD_config = {
  baseURL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
};

export const fetchMovies = async ({ query }: { query: string }) => {
  const endpoint = query
    ? `${TMBD_config.baseURL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMBD_config.baseURL}/discover/movie?sort_by=popularity.desc`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMBD_config.headers,
  });
  if (!response.ok) {
    //@ts-ignore
    throw new Error("Failed to fetch movies", response.statusText);
  }

  const data = await response.json();
  return data.results;
};

export const fetchMovieDetails = async (
  movie_id: string,
): Promise<MovieDetails> => {
  const endpoint = `${TMBD_config.baseURL}/movie/${movie_id}?api_key=${TMBD_config.API_KEY}&append_to_response=credits`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMBD_config.headers,
  });
  if (!response.ok) {
    //@ts-ignore
    throw new Error("Failed to fetch movie details", response.statusText);
  }

  const data = await response.json();
  return data as MovieDetails;
};
