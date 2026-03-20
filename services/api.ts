// const url = 'https://api.themoviedb.org/3/authentication';
// const options = {
//   method: 'GET',
//   headers: {
//     accept: 'application/json',
//     Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4M2ZlOTgxZmM5NjBhYzUzMmNlMDA0YmQ5ZTY3NDljMCIsIm5iZiI6MTc3MzY3ODk1Ny41MzksInN1YiI6IjY5YjgzMTZkMWU2ZmEzMDcyNDAyMDMxYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.5HLuQlUz6rFY2XQ2q2dfdpjeLMKd7fZ0dV9pTEKsnDI'
//   }
// };

// fetch(url, options)
//   .then(res => res.json())
//   .then(json => console.log(json))
//   .catch(err => console.error(err));

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
