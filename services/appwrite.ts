import { Client, ID, Query, TablesDB } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID as string;
const SEARCH_METRICS_TABLE_ID =
  (process.env.EXPO_PUBLIC_SEARCH_METRICS_TABLE_ID ||
    process.env.EXPO_PUBLIC_SEARCH_METRICS_COLLECTION_ID ||
    process.env.EXPO_PUBLIC_COLLECTION_ID) as string;
const USER_PROFILE_TABLE_ID =
  (process.env.EXPO_PUBLIC_USER_PROFILE_TABLE_ID ||
    process.env.EXPO_PUBLIC_USER_PROFILE_COLLECTION_ID) as string;
const MOVIE_LISTS_TABLE_ID =
  (process.env.EXPO_PUBLIC_MOVIE_LISTS_TABLE_ID ||
    process.env.EXPO_PUBLIC_MOVIE_LISTS_COLLECTION_ID) as string;
const LIST_ITEMS_TABLE_ID =
  (process.env.EXPO_PUBLIC_LIST_ITEMS_TABLE_ID ||
    process.env.EXPO_PUBLIC_LIST_ITEMS_COLLECTION_ID ||
    process.env.EXPO_PUBLIC_LIST_ITEMS_COLLECTIONS_ID) as string;
const WATCH_HISTORY_TABLE_ID =
  (process.env.EXPO_PUBLIC_WATCH_HISTORY_TABLE_ID ||
    process.env.EXPO_PUBLIC_WATCH_HISTORY_COLLECTION_ID) as string;

const LOCAL_USER_ID = "local-user";
const DEFAULT_PROFILE_ROW_ID = "local-user-profile";
const DEFAULT_SAVED_LIST_ID = "default-saved-list";
const DEFAULT_SAVED_LIST_SLUG = "saved-list";
const DEFAULT_WATCHED_LIST_SLUG = "watched-list";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const tables = new TablesDB(client);

const defaultUserProfile: UserProfile = {
  $id: DEFAULT_PROFILE_ROW_ID,
  user_id: LOCAL_USER_ID,
  name: "Gina Pham",
  bio: "Building a personal movie library with watched activity and custom lists.",
  profile_image_url: "",
};

const defaultWatchedList: MovieList = {
  $id: "default-watched-list",
  user_id: LOCAL_USER_ID,
  name: "Watched List",
  slug: DEFAULT_WATCHED_LIST_SLUG,
  type: "system",
  is_default: false,
};

let localIdCounter = 0;
const nextLocalId = (prefix: string) => `${prefix}-${Date.now()}-${localIdCounter++}`;
let localProfile: UserProfile = { ...defaultUserProfile };
let localCustomLists: MovieList[] = [];
let localSavedMovies: TrendingMovie[] = [];
let localListItems: ListItem[] = [];
let localWatchHistory: WatchHistoryEntry[] = [];

const toPosterUrl = (posterPath?: string | null) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "";

const toSavedMetric = (movie: Movie | MovieDetails, saved: boolean): TrendingMovie => ({
  $id: nextLocalId("saved"),
  searchTerm: movie.title,
  count: 0,
  movie_id: movie.id,
  title: movie.title,
  poster_url: toPosterUrl(movie.poster_path),
  saved,
  release_date: movie.release_date,
  vote_average: movie.vote_average,
});

const toLocalListItem = (
  listId: string,
  movie: Movie | MovieDetails,
): ListItem => ({
  $id: nextLocalId("list-item"),
  user_id: LOCAL_USER_ID,
  list_id: listId,
  movie_id: movie.id,
  title: movie.title,
  poster_url: toPosterUrl(movie.poster_path),
  release_date: movie.release_date,
  vote_average: movie.vote_average,
  added_at: new Date().toISOString(),
});

const toLocalWatchHistoryEntry = (movie: Movie | MovieDetails): WatchHistoryEntry => ({
  $id: nextLocalId("watch"),
  user_id: LOCAL_USER_ID,
  movie_id: movie.id,
  title: movie.title,
  poster_url: toPosterUrl(movie.poster_path),
  vote_average: movie.vote_average,
  release_date: movie.release_date,
  watched_at: new Date().toISOString(),
});

const isExpectedAppwriteFallbackError = (error: unknown) => {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("not authorized") ||
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("table with the requested id") ||
    message.includes("attribute not found in schema") ||
    message.includes("invalid query")
  );
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getRangeStart = (range: ProfileRange) => {
  const now = new Date();

  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "month") {
    const start = new Date(now);
    start.setDate(now.getDate() - 27);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
};

const isWithinRange = (isoDate: string, range: ProfileRange) => {
  const rangeStart = getRangeStart(range);

  if (!rangeStart) return true;

  return new Date(isoDate) >= rangeStart;
};

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short" });

const buildWeekBuckets = (entries: WatchHistoryEntry[]): ChartBucket[] => {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  return dates.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const value = entries.filter((entry) => entry.watched_at.slice(0, 10) === key).length;

    return { label: formatDayLabel(date), value };
  });
};

const buildMonthBuckets = (entries: WatchHistoryEntry[]): ChartBucket[] => {
  const today = new Date();
  const buckets = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(today);
    start.setDate(today.getDate() - (27 - index * 7));
    start.setHours(0, 0, 0, 0);
    return {
      start,
      end: new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000),
      label: `W${index + 1}`,
    };
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: entries.filter((entry) => {
      const watchedAt = new Date(entry.watched_at);
      return watchedAt >= bucket.start && watchedAt <= bucket.end;
    }).length,
  }));
};

const buildAllTimeBuckets = (entries: WatchHistoryEntry[]): ChartBucket[] => {
  if (entries.length === 0) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { label: formatMonthLabel(date), value: 0 };
    });
  }

  const latest = new Date(
    Math.max(...entries.map((entry) => new Date(entry.watched_at).getTime())),
  );

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(latest.getFullYear(), latest.getMonth() - (5 - index), 1);
    return { date, label: formatMonthLabel(date) };
  });

  return months.map(({ date, label }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const value = entries.filter((entry) => {
      const watchedAt = new Date(entry.watched_at);
      return watchedAt.getFullYear() === year && watchedAt.getMonth() === month;
    }).length;

    return { label, value };
  });
};

const buildChartBuckets = (
  entries: WatchHistoryEntry[],
  range: ProfileRange,
): ChartBucket[] => {
  if (range === "week") return buildWeekBuckets(entries);
  if (range === "month") return buildMonthBuckets(entries);
  return buildAllTimeBuckets(entries);
};

const listRowsAll = async <T>({
  tableId,
  queries = [],
}: {
  tableId: string;
  queries?: string[];
}): Promise<T[]> => {
  const result = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId,
    queries: [...queries, Query.limit(500)],
  });

  return result.rows as unknown as T[];
};

const toListItemFromMetricRow = (row: TrendingMovie): ListItem => ({
  $id: row.$id,
  user_id: LOCAL_USER_ID,
  list_id: DEFAULT_SAVED_LIST_ID,
  movie_id: row.movie_id,
  title: row.title,
  poster_url: row.poster_url,
  release_date: row.release_date,
  vote_average: row.vote_average,
  added_at: new Date().toISOString(),
});

const getSavedMetricsRows = async (): Promise<TrendingMovie[]> => {
  try {
    const rows = await listRowsAll<TrendingMovie>({
      tableId: SEARCH_METRICS_TABLE_ID,
      queries: [Query.equal("saved", true), Query.orderDesc("$createdAt")],
    });

    return [...rows, ...localSavedMovies.filter((movie) => movie.saved)];
  } catch {
    return localSavedMovies.filter((movie) => movie.saved);
  }
};

const getMetricsRowByMovieId = async (movieId: number) => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SEARCH_METRICS_TABLE_ID,
      queries: [Query.equal("movie_id", movieId), Query.limit(1)],
    });

    return (
      result.rows.find(Boolean) ??
      localSavedMovies.find((movie) => movie.movie_id === movieId) ??
      null
    );
  } catch {
    return localSavedMovies.find((movie) => movie.movie_id === movieId) ?? null;
  }
};

const getSystemLists = (): MovieList[] => [
  {
    $id: DEFAULT_SAVED_LIST_ID,
    user_id: LOCAL_USER_ID,
    name: "Saved",
    slug: DEFAULT_SAVED_LIST_SLUG,
    type: "system",
    is_default: true,
  },
];

const mergeLists = (lists: MovieList[]) => {
  const seen = new Set<string>();
  return lists.filter((list) => {
    if (seen.has(list.$id)) return false;
    seen.add(list.$id);
    return true;
  });
};

const getDefaultWatchedList = async (): Promise<MovieList> => {
  try {
    const existing = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: MOVIE_LISTS_TABLE_ID,
      queries: [
        Query.equal("user_id", LOCAL_USER_ID),
        Query.equal("slug", DEFAULT_WATCHED_LIST_SLUG),
        Query.limit(1),
      ],
    });

    if (existing.rows.length > 0) {
      return existing.rows[0] as unknown as MovieList;
    }

    const created = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: MOVIE_LISTS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        user_id: LOCAL_USER_ID,
        name: "Watched List",
        slug: DEFAULT_WATCHED_LIST_SLUG,
        type: "system",
        is_default: true,
      },
    });

    return created as unknown as MovieList;
  } catch {
    return defaultWatchedList;
  }
};

export const updateSeachCount = async (query: string, movie: Movie) => {
  if (!SEARCH_METRICS_TABLE_ID) {
    return;
  }

  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SEARCH_METRICS_TABLE_ID,
      queries: [Query.equal("searchTerm", query)],
    });

    if (result.rows.length > 0) {
      const existing = result.rows[0];
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: SEARCH_METRICS_TABLE_ID,
        rowId: existing.$id,
        data: { count: (existing as unknown as { count: number }).count + 1 },
      });
    } else {
      await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: SEARCH_METRICS_TABLE_ID,
        rowId: ID.unique(),
        data: {
          searchTerm: query,
          count: 1,
          movie_id: movie.id,
          title: movie.title,
          poster_url: toPosterUrl(movie.poster_path),
          saved: false,
        },
      });
    }
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      console.warn("Error updating search count:", error);
    }
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
  if (!SEARCH_METRICS_TABLE_ID) {
    return undefined;
  }

  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SEARCH_METRICS_TABLE_ID,
      queries: [Query.limit(5), Query.greaterThan("count", 0), Query.orderDesc("count")],
    });
    return result.rows as unknown as TrendingMovie[];
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      console.warn("Error fetching trending movies:", error);
    }
    return undefined;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!USER_PROFILE_TABLE_ID) {
    return localProfile;
  }

  try {
    try {
      const result = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: USER_PROFILE_TABLE_ID,
        queries: [Query.equal("user_id", LOCAL_USER_ID), Query.limit(1)],
      });

      if (result.rows.length > 0) {
        return {
          ...localProfile,
          ...(result.rows[0] as unknown as Partial<UserProfile>),
        };
      }
    } catch (error) {
      if (!isExpectedAppwriteFallbackError(error)) {
        throw error;
      }

      const fallbackResult = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: USER_PROFILE_TABLE_ID,
        queries: [Query.limit(1)],
      });

      if (fallbackResult.rows.length > 0) {
        return {
          ...localProfile,
          ...(fallbackResult.rows[0] as unknown as Partial<UserProfile>),
        };
      }
    }

    const created = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: USER_PROFILE_TABLE_ID,
      rowId: DEFAULT_PROFILE_ROW_ID,
      data: defaultUserProfile,
    });

    return {
      ...localProfile,
      ...(created as unknown as Partial<UserProfile>),
    };
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      console.warn("Error fetching user profile:", error);
    }
    return localProfile;
  }
};

export const upsertUserProfile = async (
  data: Partial<UserProfile>,
): Promise<UserProfile> => {
  localProfile = { ...localProfile, ...data };

  if (!USER_PROFILE_TABLE_ID) {
    return localProfile;
  }

  const existing = await getUserProfile();

  const row = await tables.upsertRow({
    databaseId: DATABASE_ID,
    tableId: USER_PROFILE_TABLE_ID,
    rowId: existing?.$id ?? DEFAULT_PROFILE_ROW_ID,
    data: {
      ...defaultUserProfile,
      ...data,
    },
  });

  return { ...localProfile, ...(row as unknown as Partial<UserProfile>) };
};

export const getLists = async (): Promise<MovieList[]> => {
  try {
    const watchedList = await getDefaultWatchedList();

    const rows = await listRowsAll<MovieList>({
      tableId: MOVIE_LISTS_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID)],
    });
    const merged = mergeLists([
      ...getSystemLists(),
      watchedList,
      ...localCustomLists,
      ...rows.filter((list) => list.$id !== watchedList.$id),
    ]);

    return merged.sort((left, right) => {
      if (left.is_default !== right.is_default) {
        return left.is_default ? -1 : 1;
      }

      if (left.type !== right.type) {
        return left.type === "system" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      console.warn("Error fetching lists:", error);
    }
    return mergeLists([...getSystemLists(), defaultWatchedList, ...localCustomLists]);
  }
};

export const createList = async (name: string): Promise<MovieList> => {
  const trimmedName = name.trim();
  const slug = slugify(trimmedName);

  if (!trimmedName || !slug) {
    throw new Error("List name is required.");
  }

  const localExisting = localCustomLists.find((list) => list.slug === slug);
  if (localExisting) {
    throw new Error("A list with that name already exists.");
  }

  try {
    const existing = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: MOVIE_LISTS_TABLE_ID,
      queries: [
        Query.equal("user_id", LOCAL_USER_ID),
        Query.equal("slug", slug),
        Query.limit(1),
      ],
    });

    if (existing.rows.length > 0) {
      throw new Error("A list with that name already exists.");
    }

    const row = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: MOVIE_LISTS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        user_id: LOCAL_USER_ID,
        name: trimmedName,
        slug,
        type: "custom",
        is_default: false,
      },
    });

    return row as unknown as MovieList;
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      throw error;
    }

    const list: MovieList = {
      $id: nextLocalId("list"),
      user_id: LOCAL_USER_ID,
      name: trimmedName,
      slug,
      type: "custom",
      is_default: false,
    };
    localCustomLists = [...localCustomLists, list];
    return list;
  }
};

export const getListItems = async (listId: string): Promise<ListItem[]> => {
  try {
    if (listId === DEFAULT_SAVED_LIST_ID) {
      const rows = await getSavedMetricsRows();
      return rows.map(toListItemFromMetricRow);
    }

    const rows = await listRowsAll<ListItem>({
      tableId: LIST_ITEMS_TABLE_ID,
      queries: [
        Query.equal("user_id", LOCAL_USER_ID),
        Query.equal("list_id", listId),
        Query.orderDesc("added_at"),
      ],
    });

    return [
      ...rows,
      ...localListItems.filter((item) => item.list_id === listId),
    ].sort((left, right) => right.added_at.localeCompare(left.added_at));
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      console.warn("Error fetching list items:", error);
    }
    if (listId === DEFAULT_SAVED_LIST_ID) {
      return localSavedMovies.filter((movie) => movie.saved).map(toListItemFromMetricRow);
    }
    return localListItems
      .filter((item) => item.list_id === listId)
      .sort((left, right) => right.added_at.localeCompare(left.added_at));
  }
};

const getListItemsByMovieId = async (movieId: number): Promise<ListItem[]> => {
  try {
    const rows = await listRowsAll<ListItem>({
      tableId: LIST_ITEMS_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID), Query.equal("movie_id", movieId)],
    });

    return [
      ...rows,
      ...localListItems.filter((item) => item.movie_id === movieId),
    ];
  } catch {
    return localListItems.filter((item) => item.movie_id === movieId);
  }
};

export const addMovieToList = async (
  listId: string,
  movie: Movie | MovieDetails,
): Promise<ListItem> => {
  const localExisting = localListItems.find(
    (item) => item.list_id === listId && item.movie_id === movie.id,
  );
  if (localExisting) return localExisting;

  try {
    const existing = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: LIST_ITEMS_TABLE_ID,
      queries: [
        Query.equal("user_id", LOCAL_USER_ID),
        Query.equal("list_id", listId),
        Query.equal("movie_id", movie.id),
        Query.limit(1),
      ],
    });

    if (existing.rows.length > 0) {
      return existing.rows[0] as unknown as ListItem;
    }

    const created = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: LIST_ITEMS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        user_id: LOCAL_USER_ID,
        list_id: listId,
        movie_id: movie.id,
        title: movie.title,
        poster_url: toPosterUrl(movie.poster_path),
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        added_at: new Date().toISOString(),
      },
    });

    return created as unknown as ListItem;
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      throw error;
    }

    const item = toLocalListItem(listId, movie);
    localListItems = [...localListItems, item];
    return item;
  }
};

export const removeMovieFromList = async (
  listId: string,
  movieId: number,
): Promise<void> => {
  localListItems = localListItems.filter(
    (item) => !(item.list_id === listId && item.movie_id === movieId),
  );

  try {
    const existing = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: LIST_ITEMS_TABLE_ID,
      queries: [
        Query.equal("user_id", LOCAL_USER_ID),
        Query.equal("list_id", listId),
        Query.equal("movie_id", movieId),
        Query.limit(1),
      ],
    });

    if (existing.rows.length === 0) return;

    await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: LIST_ITEMS_TABLE_ID,
      rowId: existing.rows[0].$id,
    });
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      throw error;
    }
  }
};

export const getMovieListStatus = async (movieId: number): Promise<MovieListStatus> => {
  const [lists, itemsResult, metricRow] = await Promise.all([
    getLists(),
    getListItemsByMovieId(movieId),
    getMetricsRowByMovieId(movieId),
  ]);

  const watchedList = lists.find((list) => list.slug === DEFAULT_WATCHED_LIST_SLUG);
  const customListIds = itemsResult
    .filter((item) => item.list_id !== watchedList?.$id)
    .map((item) => item.list_id);

  return {
    saved: Boolean((metricRow as TrendingMovie | null)?.saved),
    watched: watchedList
      ? itemsResult.some((item) => item.list_id === watchedList.$id)
      : false,
    watchedListId: watchedList?.$id ?? null,
    customListIds,
  };
};

export const saveMovie = async (movie: MovieDetails): Promise<TrendingMovie> => {
  const existing = await getMetricsRowByMovieId(movie.id);

  const upsertLocalSavedMovie = () => {
    const current = localSavedMovies.find((item) => item.movie_id === movie.id);
    if (current) {
      current.saved = true;
      current.title = movie.title;
      current.poster_url = toPosterUrl(movie.poster_path);
      current.release_date = movie.release_date;
      current.vote_average = movie.vote_average;
      return current;
    }

    const created = toSavedMetric(movie, true);
    localSavedMovies = [...localSavedMovies, created];
    return created;
  };

  try {
    if (existing && SEARCH_METRICS_TABLE_ID) {
      const result = await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: SEARCH_METRICS_TABLE_ID,
        rowId: existing.$id,
        data: {
          searchTerm:
            (existing as unknown as { searchTerm?: string }).searchTerm || movie.title,
          count: (existing as unknown as { count?: number }).count ?? 0,
          movie_id: movie.id,
          title: movie.title,
          poster_url: toPosterUrl(movie.poster_path),
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          saved: true,
        },
      });

      return result as unknown as TrendingMovie;
    }

    if (SEARCH_METRICS_TABLE_ID) {
      const result = await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: SEARCH_METRICS_TABLE_ID,
        rowId: ID.unique(),
        data: {
          searchTerm: movie.title,
          count: 0,
          movie_id: movie.id,
          title: movie.title,
          poster_url: toPosterUrl(movie.poster_path),
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          saved: true,
        },
      });

      return result as unknown as TrendingMovie;
    }
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      throw error;
    }
  }

  return upsertLocalSavedMovie();
};

export const removeSavedMovie = async (movieId: number): Promise<void> => {
  localSavedMovies = localSavedMovies.map((movie) =>
    movie.movie_id === movieId ? { ...movie, saved: false } : movie,
  );

  const existing = await getMetricsRowByMovieId(movieId);
  if (!existing || !SEARCH_METRICS_TABLE_ID) return;

  try {
    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: SEARCH_METRICS_TABLE_ID,
      rowId: existing.$id,
      data: { saved: false },
    });
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      throw error;
    }
  }
};

export const markMovieWatched = async (movie: Movie | MovieDetails): Promise<void> => {
  const watchedList = await getDefaultWatchedList();
  const localExisting = localWatchHistory.find((entry) => entry.movie_id === movie.id);
  if (!localExisting) {
    localWatchHistory = [...localWatchHistory, toLocalWatchHistoryEntry(movie)];
  }

  try {
    if (WATCH_HISTORY_TABLE_ID) {
      const existing = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: WATCH_HISTORY_TABLE_ID,
        queries: [
          Query.equal("user_id", LOCAL_USER_ID),
          Query.equal("movie_id", movie.id),
          Query.limit(1),
        ],
      });

      if (existing.rows.length === 0) {
        await tables.createRow({
          databaseId: DATABASE_ID,
          tableId: WATCH_HISTORY_TABLE_ID,
          rowId: ID.unique(),
          data: {
            user_id: LOCAL_USER_ID,
            movie_id: movie.id,
            title: movie.title,
            poster_url: toPosterUrl(movie.poster_path),
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            watched_at: new Date().toISOString(),
          },
        });
      }
    }
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      throw error;
    }
  }

  await addMovieToList(watchedList.$id, movie);
};

export const getWatchHistory = async (
  range: ProfileRange = "all",
): Promise<WatchHistoryEntry[]> => {
  try {
    const rows = await listRowsAll<WatchHistoryEntry>({
      tableId: WATCH_HISTORY_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID), Query.orderDesc("watched_at")],
    });
    const merged = [...rows, ...localWatchHistory].sort((left, right) =>
      right.watched_at.localeCompare(left.watched_at),
    );
    const seen = new Set<number>();
    return merged
      .filter((entry) => {
        if (seen.has(entry.movie_id)) return false;
        seen.add(entry.movie_id);
        return true;
      })
      .filter((entry) => isWithinRange(entry.watched_at, range));
  } catch (error) {
    if (!isExpectedAppwriteFallbackError(error)) {
      console.warn("Error fetching watch history:", error);
    }
    return localWatchHistory.filter((entry) => isWithinRange(entry.watched_at, range));
  }
};

export const getProfileStats = async (
  range: ProfileRange = "all",
): Promise<ProfileStats> => {
  const [lists, allItemsResult, allWatchHistory, savedMetricsRows] = await Promise.all([
    getLists(),
    (async () => {
      try {
        const remoteItems = await listRowsAll<ListItem>({
          tableId: LIST_ITEMS_TABLE_ID,
          queries: [Query.equal("user_id", LOCAL_USER_ID)],
        });

        return [...remoteItems, ...localListItems];
      } catch {
        return [...localListItems];
      }
    })(),
    getWatchHistory("all"),
    getSavedMetricsRows(),
  ]);

  const filteredWatchHistory = allWatchHistory.filter((entry) =>
    isWithinRange(entry.watched_at, range),
  );
  const watchedList = lists.find((list) => list.slug === DEFAULT_WATCHED_LIST_SLUG);
  const savedMovieIds = new Set([
    ...savedMetricsRows.map((item) => item.movie_id),
    ...allItemsResult
      .filter((item) => item.list_id !== watchedList?.$id)
      .map((item) => item.movie_id),
  ]);

  return {
    saved: savedMovieIds.size,
    watched: allWatchHistory.length,
    lists: lists.length,
    range,
    chart: buildChartBuckets(filteredWatchHistory, range),
  };
};
