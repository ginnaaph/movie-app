import { Client, Databases, ID, Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID as string;
const COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID as string;

const client = new Client();

client
  .setEndpoint("https://sfo.cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);

export const updateSeachCount = async (query: string, movie: Movie) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", query),
    ]);
    if (result.documents.length > 0) {
      const existingMovie = result.documents[0];
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existingMovie.$id,
        {
          count: existingMovie.count + 1,
        },
      );
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm: query,
        count: 1,
        movie_id: movie.id,
        title: movie.title,

        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ]);

    return result.documents as unknown as TrendingMovie[];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return undefined;
  }
};

export const getSavedMovies = async (): Promise<SavedMovie[] | undefined> => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("saved", true),
      Query.orderDesc("$createdAt"),
    ]);

    return result.documents as unknown as SavedMovie[];
  } catch (error) {
    console.error("Error fetching saved movies:", error);
    return undefined;
  }
};

const getSavedMovieDocument = async (
  movieId: number,
): Promise<SavedMovie | null> => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("movie_id", movieId),
    ]);

    if (result.documents.length === 0) {
      return null;
    }

    return result.documents[0] as unknown as SavedMovie;
  } catch (error) {
    console.error("Error fetching saved movie:", error);
    return null;
  }
};

export const getSavedMovie = async (
  movieId: number,
): Promise<SavedMovie | null> => {
  const movie = await getSavedMovieDocument(movieId);

  if (!movie?.saved) {
    return null;
  }

  return movie;
};

export const saveMovie = async (movie: MovieDetails): Promise<SavedMovie> => {
  const existingMovie = await getSavedMovieDocument(movie.id);

  if (existingMovie) {
    const result = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      existingMovie.$id,
      {
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        release_date: movie.release_date,
        saved: true,
        vote_average: movie.vote_average,
      },
    );

    return result as unknown as SavedMovie;
  }

  const result = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    {
      movie_id: movie.id,
      title: movie.title,
      poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      release_date: movie.release_date,
      saved: true,
      vote_average: movie.vote_average,
    },
  );

  return result as unknown as SavedMovie;
};

export const removeSavedMovie = async (movieId: number): Promise<void> => {
  const existingMovie = await getSavedMovieDocument(movieId);

  if (!existingMovie) {
    return;
  }

  await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID,
    existingMovie.$id,
    {
      saved: false,
    },
  );
};
