import { Client, ID, Query, TablesDB } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID as string;
const METRICS_TABLE_ID = process.env.EXPO_PUBLIC_COLLECTION_ID as string;
const USER_PROFILE_TABLE_ID = process.env.EXPO_PUBLIC_USER_PROFILE_COLLECTION_ID as string;
const WATCH_HISTORY_TABLE_ID = process.env.EXPO_PUBLIC_WATCH_HISTORY_COLLECTION_ID as string;

const LOCAL_USER_ID = "local-user";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const tables = new TablesDB(client);

export const updateSeachCount = async (query: string, movie: Movie) => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: METRICS_TABLE_ID,
      queries: [Query.equal("searchTerm", query)],
    });

    if (result.rows.length > 0) {
      const existing = result.rows[0];
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: METRICS_TABLE_ID,
        rowId: existing.$id,
        data: { count: (existing as unknown as { count: number }).count + 1 },
      });
    } else {
      await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: METRICS_TABLE_ID,
        rowId: ID.unique(),
        data: {
          searchTerm: query,
          count: 1,
          movie_id: movie.id,
          saved: false,
          title: movie.title,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        },
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: METRICS_TABLE_ID,
      queries: [Query.limit(5), Query.greaterThan("count", 0), Query.orderDesc("count")],
    });
    return result.rows as unknown as TrendingMovie[];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return undefined;
  }
};

export const getSavedMovies = async (): Promise<SavedMovie[] | undefined> => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: METRICS_TABLE_ID,
      queries: [Query.equal("saved", true), Query.orderDesc("$createdAt")],
    });
    return result.rows as unknown as SavedMovie[];
  } catch (error) {
    console.error("Error fetching saved movies:", error);
    return undefined;
  }
};

const getMetricsRowByMovieId = async (movieId: number) => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: METRICS_TABLE_ID,
      queries: [Query.equal("movie_id", movieId)],
    });
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error fetching metrics row:", error);
    return null;
  }
};

export const getSavedMovie = async (movieId: number): Promise<SavedMovie | null> => {
  const row = await getMetricsRowByMovieId(movieId);
  const movie = row as unknown as SavedMovie | null;
  if (!movie?.saved) return null;
  return movie;
};

export const saveMovie = async (movie: MovieDetails): Promise<SavedMovie> => {
  const existing = await getMetricsRowByMovieId(movie.id);

  if (existing) {
    const result = await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: METRICS_TABLE_ID,
      rowId: existing.$id,
      data: {
        searchTerm: movie.title,
        count: (existing as unknown as { count: number }).count ?? 0,
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        saved: true,
      },
    });
    return result as unknown as SavedMovie;
  }

  const result = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: METRICS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      searchTerm: movie.title,
      count: 0,
      movie_id: movie.id,
      title: movie.title,
      poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      saved: true,
    },
  });
  return result as unknown as SavedMovie;
};

export const removeSavedMovie = async (movieId: number): Promise<void> => {
  const existing = await getMetricsRowByMovieId(movieId);
  if (!existing) return;

  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: METRICS_TABLE_ID,
    rowId: existing.$id,
    data: { saved: false },
  });
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const row = await tables.getRow({
      databaseId: DATABASE_ID,
      tableId: USER_PROFILE_TABLE_ID,
      rowId: LOCAL_USER_ID,
    });
    return row as unknown as UserProfile;
  } catch {
    return null;
  }
};

export const upsertUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const row = await tables.upsertRow({
    databaseId: DATABASE_ID,
    tableId: USER_PROFILE_TABLE_ID,
    rowId: LOCAL_USER_ID,
    data: { name: "Your Name", bio: "", profile_image_url: "", ...data },
  });
  return row as unknown as UserProfile;
};

export const getProfileStats = async (): Promise<ProfileStats> => {
  const [savedResult, watchedResult] = await Promise.all([
    tables.listRows({
      databaseId: DATABASE_ID,
      tableId: METRICS_TABLE_ID,
      queries: [Query.equal("saved", true), Query.limit(1)],
    }),
    tables.listRows({
      databaseId: DATABASE_ID,
      tableId: WATCH_HISTORY_TABLE_ID,
      queries: [Query.limit(1)],
    }),
  ]);

  return { saved: savedResult.total, watched: watchedResult.total };
};

export const addToWatchHistory = async (movie: Movie): Promise<void> => {
  try {
    const existing = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: WATCH_HISTORY_TABLE_ID,
      queries: [Query.equal("movie_id", movie.id)],
    });

    if (existing.rows.length > 0) return;

    await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: WATCH_HISTORY_TABLE_ID,
      rowId: ID.unique(),
      data: {
        movie_id: movie.id,
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        watched_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error adding to watch history:", error);
  }
};

export const getWatchHistory = async (): Promise<WatchedMovie[]> => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: WATCH_HISTORY_TABLE_ID,
      queries: [Query.orderDesc("watched_at")],
    });
    return result.rows as unknown as WatchedMovie[];
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return [];
  }
};
