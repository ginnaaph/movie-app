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

const toPosterUrl = (posterPath?: string | null) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "";

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
  const rows = await listRowsAll<TrendingMovie>({
    tableId: SEARCH_METRICS_TABLE_ID,
    queries: [Query.equal("saved", true), Query.orderDesc("$createdAt")],
  });

  return rows;
};

const getMetricsRowByMovieId = async (movieId: number) => {
  const result = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: SEARCH_METRICS_TABLE_ID,
    queries: [Query.equal("movie_id", movieId), Query.limit(1)],
  });

  return result.rows.length > 0 ? result.rows[0] : null;
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

const getDefaultWatchedList = async (): Promise<MovieList> => {
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
};

export const updateSeachCount = async (query: string, movie: Movie) => {
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
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: SEARCH_METRICS_TABLE_ID,
      queries: [Query.limit(5), Query.greaterThan("count", 0), Query.orderDesc("count")],
    });
    return result.rows as unknown as TrendingMovie[];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return undefined;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!USER_PROFILE_TABLE_ID) {
    return defaultUserProfile;
  }

  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: USER_PROFILE_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID), Query.limit(1)],
    });

    if (result.rows.length > 0) {
      return result.rows[0] as unknown as UserProfile;
    }

    const created = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: USER_PROFILE_TABLE_ID,
      rowId: DEFAULT_PROFILE_ROW_ID,
      data: defaultUserProfile,
    });

    return created as unknown as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return defaultUserProfile;
  }
};

export const upsertUserProfile = async (
  data: Partial<UserProfile>,
): Promise<UserProfile> => {
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

  return row as unknown as UserProfile;
};

export const getLists = async (): Promise<MovieList[]> => {
  try {
    const watchedList = await getDefaultWatchedList();

    const rows = await listRowsAll<MovieList>({
      tableId: MOVIE_LISTS_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID)],
    });
    const merged = [
      ...getSystemLists(),
      watchedList,
      ...rows.filter((list) => list.$id !== watchedList.$id),
    ];

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
    console.error("Error fetching lists:", error);
    return [];
  }
};

export const createList = async (name: string): Promise<MovieList> => {
  const trimmedName = name.trim();
  const slug = slugify(trimmedName);

  if (!trimmedName || !slug) {
    throw new Error("List name is required.");
  }

  const existing = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: MOVIE_LISTS_TABLE_ID,
    queries: [Query.equal("user_id", LOCAL_USER_ID), Query.equal("slug", slug), Query.limit(1)],
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

    return rows;
  } catch (error) {
    console.error("Error fetching list items:", error);
    return [];
  }
};

export const addMovieToList = async (
  listId: string,
  movie: Movie | MovieDetails,
): Promise<ListItem> => {
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
};

export const removeMovieFromList = async (
  listId: string,
  movieId: number,
): Promise<void> => {
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
};

export const getMovieListStatus = async (movieId: number): Promise<MovieListStatus> => {
  const [lists, items, metricRow] = await Promise.all([
    getLists(),
    listRowsAll<ListItem>({
      tableId: LIST_ITEMS_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID), Query.equal("movie_id", movieId)],
    }),
    getMetricsRowByMovieId(movieId),
  ]);

  const watchedList = lists.find((list) => list.slug === DEFAULT_WATCHED_LIST_SLUG);
  const customListIds = items
    .filter((item) => item.list_id !== watchedList?.$id)
    .map((item) => item.list_id);

  return {
    saved: Boolean((metricRow as TrendingMovie | null)?.saved),
    watched: watchedList ? items.some((item) => item.list_id === watchedList.$id) : false,
    watchedListId: watchedList?.$id ?? null,
    customListIds,
  };
};

export const saveMovie = async (movie: MovieDetails): Promise<TrendingMovie> => {
  const existing = await getMetricsRowByMovieId(movie.id);

  if (existing) {
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
};

export const removeSavedMovie = async (movieId: number): Promise<void> => {
  const existing = await getMetricsRowByMovieId(movieId);

  if (!existing) return;

  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: SEARCH_METRICS_TABLE_ID,
    rowId: existing.$id,
    data: { saved: false },
  });
};

export const markMovieWatched = async (movie: Movie | MovieDetails): Promise<void> => {
  const watchedList = await getDefaultWatchedList();

  const existing = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: WATCH_HISTORY_TABLE_ID,
    queries: [Query.equal("user_id", LOCAL_USER_ID), Query.equal("movie_id", movie.id), Query.limit(1)],
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

    return rows.filter((entry) => isWithinRange(entry.watched_at, range));
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return [];
  }
};

export const getProfileStats = async (
  range: ProfileRange = "all",
): Promise<ProfileStats> => {
  const [lists, allItems, allWatchHistory, savedMetricsRows] = await Promise.all([
    getLists(),
    listRowsAll<ListItem>({
      tableId: LIST_ITEMS_TABLE_ID,
      queries: [Query.equal("user_id", LOCAL_USER_ID)],
    }),
    getWatchHistory("all"),
    getSavedMetricsRows(),
  ]);

  const filteredWatchHistory = allWatchHistory.filter((entry) =>
    isWithinRange(entry.watched_at, range),
  );
  const watchedList = lists.find((list) => list.slug === DEFAULT_WATCHED_LIST_SLUG);
  const savedMovieIds = new Set(
    [
      ...savedMetricsRows.map((item) => item.movie_id),
      ...allItems
      .filter((item) => item.list_id !== watchedList?.$id)
      .map((item) => item.movie_id),
    ],
  );

  return {
    saved: savedMovieIds.size,
    watched: allWatchHistory.length,
    lists: lists.length,
    range,
    chart: buildChartBuckets(filteredWatchHistory, range),
  };
};
