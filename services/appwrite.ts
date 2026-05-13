import { Account, Client, ID, Query, TablesDB } from "react-native-appwrite";
import {
  getMediaFieldFallbackPayloads,
  optionalMediaMetadataKeys,
} from "./appwritePayloads";
import { getListItemMetadataRepairPayload } from "./listItemMetadata";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const requireTableId = (value: string | undefined, envName: string): string => {
  if (!value) {
    throw new Error(`Missing required Appwrite table id: ${envName}`);
  }
  return value;
};

const DATABASE_ID = requireEnv("EXPO_PUBLIC_DATABASE_ID");
const SEARCH_METRICS_TABLE_ID = requireTableId(
  process.env.EXPO_PUBLIC_SEARCH_METRICS_TABLE_ID ||
    process.env.EXPO_PUBLIC_SEARCH_METRICS_COLLECTION_ID ||
    process.env.EXPO_PUBLIC_COLLECTION_ID,
  "EXPO_PUBLIC_SEARCH_METRICS_TABLE_ID",
);
const USER_PROFILE_TABLE_ID = requireTableId(
  process.env.EXPO_PUBLIC_USER_PROFILE_TABLE_ID ||
    process.env.EXPO_PUBLIC_USER_PROFILE_COLLECTION_ID,
  "EXPO_PUBLIC_USER_PROFILE_TABLE_ID",
);
const MOVIE_LISTS_TABLE_ID = requireTableId(
  process.env.EXPO_PUBLIC_MOVIE_LISTS_TABLE_ID ||
    process.env.EXPO_PUBLIC_MOVIE_LISTS_COLLECTION_ID,
  "EXPO_PUBLIC_MOVIE_LISTS_TABLE_ID",
);
const LIST_ITEMS_TABLE_ID = requireTableId(
  process.env.EXPO_PUBLIC_LIST_ITEMS_TABLE_ID ||
    process.env.EXPO_PUBLIC_LIST_ITEMS_COLLECTION_ID ||
    process.env.EXPO_PUBLIC_LIST_ITEMS_COLLECTIONS_ID,
  "EXPO_PUBLIC_LIST_ITEMS_TABLE_ID",
);
const WATCH_HISTORY_TABLE_ID = requireTableId(
  process.env.EXPO_PUBLIC_WATCH_HISTORY_TABLE_ID ||
    process.env.EXPO_PUBLIC_WATCH_HISTORY_COLLECTION_ID,
  "EXPO_PUBLIC_WATCH_HISTORY_TABLE_ID",
);

const DEFAULT_SAVED_LIST_ID = "default-saved-list";
const DEFAULT_SAVED_LIST_SLUG = "saved-list";
const DEFAULT_WATCHED_LIST_SLUG = "watched-list";

const client = new Client()
  .setEndpoint(requireEnv("EXPO_PUBLIC_APPWRITE_ENDPOINT"))
  .setProject(requireEnv("EXPO_PUBLIC_APPWRITE_PROJECT_ID"));

const account = new Account(client);
const tables = new TablesDB(client);

let cachedUserId: string | null = null;

export const ensureAppwriteSession = async (): Promise<string> => {
  if (cachedUserId) return cachedUserId;

  try {
    const existingUser = await account.get();
    if (!existingUser?.$id) {
      throw new Error("No authenticated Appwrite user session found.");
    }

    cachedUserId = existingUser.$id;
    return existingUser.$id;
  } catch {
    await account.createAnonymousSession();
    const createdUser = await account.get();

    if (!createdUser?.$id) {
      throw new Error("Unable to establish an Appwrite user session.");
    }

    cachedUserId = createdUser.$id;
    return createdUser.$id;
  }
};

const getCurrentUserId = async (): Promise<string> => {
  return ensureAppwriteSession();
};

const defaultProfilePayload = (userId: string) => ({
  user_id: userId,
  name: "Movie User",
  bio: "Building a personal movie library with watched activity and custom lists.",
  profile_image_url: "",
});

const toPosterUrl = (posterPath?: string | null) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "";

const getMediaTitle = (media: Movie | MovieDetails | TVShow | TVDetails) =>
  "title" in media ? media.title : media.name;

const getMediaReleaseDate = (
  media: Movie | MovieDetails | TVShow | TVDetails,
) => ("release_date" in media ? media.release_date : media.first_air_date);

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
};

const isUnknownAttributeError = (
  error: unknown,
  attribute: string,
): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("attribute") &&
    message.includes(attribute.toLowerCase()) &&
    (message.includes("unknown") ||
      message.includes("not found") ||
      message.includes("invalid"))
  );
};

const getRowMediaType = (row: { media_type?: MediaType }) =>
  row.media_type ?? "movie";

const getRowMediaId = (row: { movie_id?: number; media_id?: number }) =>
  row.media_id ?? row.movie_id ?? 0;

const matchesMedia = (
  row: { movie_id?: number; media_id?: number; media_type?: MediaType },
  mediaId: number,
  mediaType: MediaType,
) => getRowMediaId(row) === mediaId && getRowMediaType(row) === mediaType;

const listRowsByMediaId = async <T>({
  tableId,
  userId,
  mediaId,
  extraQueries = [],
}: {
  tableId: string;
  userId: string;
  mediaId: number;
  extraQueries?: string[];
}): Promise<T[]> => {
  try {
    const result = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [
        Query.equal("user_id", userId),
        ...extraQueries,
        Query.equal("media_id", mediaId),
        Query.limit(10),
      ],
    });

    return result.rows as unknown as T[];
  } catch (error) {
    if (!isUnknownAttributeError(error, "media_id")) {
      throw error;
    }

    const legacyResult = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [
        Query.equal("user_id", userId),
        ...extraQueries,
        Query.equal("movie_id", mediaId),
        Query.limit(10),
      ],
    });

    return legacyResult.rows as unknown as T[];
  }
};

const isMediaSchemaCompatibilityError = (error: unknown) =>
  isUnknownAttributeError(error, "media_type") ||
  isUnknownAttributeError(error, "media_id") ||
  isUnknownAttributeError(error, "movie_id") ||
  optionalMediaMetadataKeys.some((attribute) =>
    isUnknownAttributeError(error, attribute),
  );

const runWithMediaFieldFallback = async <T>(
  payloads: Record<string, unknown>[],
  operation: (payload: Record<string, unknown>) => Promise<T>,
): Promise<T> => {
  let lastCompatibilityError: unknown;

  for (const payload of payloads) {
    try {
      return await operation(payload);
    } catch (error) {
      if (!isMediaSchemaCompatibilityError(error)) {
        throw error;
      }

      lastCompatibilityError = error;
    }
  }

  throw lastCompatibilityError;
};

const createRowWithMediaFieldFallback = async ({
  tableId,
  data,
  mediaId,
}: {
  tableId: string;
  data: Record<string, unknown>;
  mediaId: number;
}) => {
  const createWithData = (payload: Record<string, unknown>) =>
    tables.createRow({
      databaseId: DATABASE_ID,
      tableId,
      rowId: ID.unique(),
      data: payload,
    });

  return runWithMediaFieldFallback(
    getMediaFieldFallbackPayloads(data, mediaId),
    createWithData,
  );
};

const updateRowWithMediaFieldFallback = async ({
  tableId,
  rowId,
  data,
  mediaId,
}: {
  tableId: string;
  rowId: string;
  data: Record<string, unknown>;
  mediaId: number;
}) => {
  const updateWithData = (payload: Record<string, unknown>) =>
    tables.updateRow({
      databaseId: DATABASE_ID,
      tableId,
      rowId,
      data: payload,
    });

  return runWithMediaFieldFallback(
    getMediaFieldFallbackPayloads(data, mediaId),
    updateWithData,
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
    const value = entries.filter(
      (entry) => entry.watched_at.slice(0, 10) === key,
    ).length;

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
    const date = new Date(
      latest.getFullYear(),
      latest.getMonth() - (5 - index),
      1,
    );
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

const toListItemFromMetricRow = (
  row: TrendingMovie,
  userId: string,
): ListItem => ({
  $id: row.$id,
  user_id: userId,
  list_id: DEFAULT_SAVED_LIST_ID,
  movie_id: getRowMediaId(row),
  media_id: row.media_id ?? row.movie_id,
  media_type: getRowMediaType(row),
  title: row.title,
  poster_url: row.poster_url,
  release_date: row.release_date,
  vote_average: row.vote_average,
  added_at: new Date().toISOString(),
});

const toListItemFromWatchHistoryEntry = (
  entry: WatchHistoryEntry,
  userId: string,
  listId: string,
): ListItem => ({
  $id: entry.$id,
  user_id: userId,
  list_id: listId,
  movie_id: getRowMediaId(entry),
  media_id: entry.media_id ?? entry.movie_id,
  media_type: getRowMediaType(entry),
  title: entry.title,
  poster_url: entry.poster_url,
  release_date: entry.release_date,
  vote_average: entry.vote_average,
  added_at: entry.watched_at,
});

const getSavedMetricsRows = async (
  userId: string,
): Promise<TrendingMovie[]> => {
  try {
    const rows = await listRowsAll<TrendingMovie>({
      tableId: SEARCH_METRICS_TABLE_ID,
      queries: [
        Query.equal("user_id", userId),
        Query.equal("saved", true),
        Query.orderDesc("$createdAt"),
      ],
    });

    return rows;
  } catch (error) {
    if (isUnknownAttributeError(error, "saved")) {
      return [];
    }

    throw error;
  }
};

const getMetricsRowByMediaId = async (
  userId: string,
  mediaId: number,
  mediaType: MediaType = "movie",
): Promise<TrendingMovie | null> => {
  const rows = await listRowsByMediaId<TrendingMovie>({
    tableId: SEARCH_METRICS_TABLE_ID,
    userId,
    mediaId,
  });

  return rows.find((row) => matchesMedia(row, mediaId, mediaType)) ?? null;
};

const mergeLists = (lists: MovieList[]) => {
  const seen = new Set<string>();
  return lists.filter((list) => {
    if (seen.has(list.$id)) return false;
    seen.add(list.$id);
    return true;
  });
};

const getDefaultSavedList = async (userId: string): Promise<MovieList> => {
  const existing = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: MOVIE_LISTS_TABLE_ID,
    queries: [
      Query.equal("user_id", userId),
      Query.equal("slug", DEFAULT_SAVED_LIST_SLUG),
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
      user_id: userId,
      name: "Saved",
      slug: DEFAULT_SAVED_LIST_SLUG,
      type: "system",
      is_default: true,
    },
  });

  return created as unknown as MovieList;
};

const getDefaultWatchedList = async (userId: string): Promise<MovieList> => {
  const existing = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: MOVIE_LISTS_TABLE_ID,
    queries: [
      Query.equal("user_id", userId),
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
      user_id: userId,
      name: "Watched List",
      slug: DEFAULT_WATCHED_LIST_SLUG,
      type: "system",
      is_default: true,
    },
  });

  return created as unknown as MovieList;
};

const getListItemsByMediaId = async (
  userId: string,
  mediaId: number,
  mediaType: MediaType = "movie",
): Promise<ListItem[]> => {
  const rows = await listRowsByMediaId<ListItem>({
    tableId: LIST_ITEMS_TABLE_ID,
    userId,
    mediaId,
  });

  return rows.filter((item) => matchesMedia(item, mediaId, mediaType));
};

export const updateSearchCount = async (
  query: string,
  media: Movie | TVShow,
  mediaType: MediaType = "movie",
) => {
  const userId = await getCurrentUserId();

  const result = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: SEARCH_METRICS_TABLE_ID,
    queries: [Query.equal("user_id", userId), Query.equal("searchTerm", query)],
  });

  if (result.rows.length > 0) {
    const existing = (result.rows as unknown as TrendingMovie[]).find((row) =>
      matchesMedia(row, media.id, mediaType),
    );

    if (existing) {
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: SEARCH_METRICS_TABLE_ID,
        rowId: existing.$id,
        data: {
          count: (existing as unknown as { count: number }).count + 1,
          title: getMediaTitle(media),
          poster_url: toPosterUrl(media.poster_path),
          release_date: getMediaReleaseDate(media),
          vote_average: media.vote_average,
        },
      });
      return;
    }
  }

  await createRowWithMediaFieldFallback({
    tableId: SEARCH_METRICS_TABLE_ID,
    mediaId: media.id,
    data: {
      user_id: userId,
      searchTerm: query,
      count: 1,
      media_type: mediaType,
      title: getMediaTitle(media),
      poster_url: toPosterUrl(media.poster_path),
      release_date: getMediaReleaseDate(media),
      vote_average: media.vote_average,
      saved: false,
    },
  });
};

export const updateSeachCount = updateSearchCount;

export const getTrendingMedia = async (
  mediaType: MediaType = "movie",
): Promise<TrendingMovie[] | undefined> => {
  const userId = await getCurrentUserId();

  const result = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: SEARCH_METRICS_TABLE_ID,
    queries: [
      Query.equal("user_id", userId),
      Query.limit(50),
      Query.greaterThan("count", 0),
      Query.orderDesc("count"),
    ],
  });

  return (result.rows as unknown as TrendingMovie[])
    .filter((row) => getRowMediaType(row) === mediaType)
    .slice(0, 5);
};

export const getTrendingMovies = () => getTrendingMedia("movie");

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const userId = await getCurrentUserId();

  const result = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: USER_PROFILE_TABLE_ID,
    queries: [Query.equal("user_id", userId), Query.limit(1)],
  });

  if (result.rows.length > 0) {
    return result.rows[0] as unknown as UserProfile;
  }

  const created = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: USER_PROFILE_TABLE_ID,
    rowId: ID.unique(),
    data: defaultProfilePayload(userId),
  });

  return created as unknown as UserProfile;
};

export const upsertUserProfile = async (
  data: Partial<UserProfile>,
): Promise<UserProfile> => {
  const userId = await getCurrentUserId();
  const existing = await getUserProfile();

  const row = await tables.upsertRow({
    databaseId: DATABASE_ID,
    tableId: USER_PROFILE_TABLE_ID,
    rowId: existing?.$id ?? ID.unique(),
    data: {
      ...defaultProfilePayload(userId),
      ...data,
      user_id: userId,
    },
  });

  return row as unknown as UserProfile;
};

export const getLists = async (): Promise<MovieList[]> => {
  const userId = await getCurrentUserId();
  const [savedList, watchedList] = await Promise.all([
    getDefaultSavedList(userId),
    getDefaultWatchedList(userId),
  ]);

  const rows = await listRowsAll<MovieList>({
    tableId: MOVIE_LISTS_TABLE_ID,
    queries: [Query.equal("user_id", userId)],
  });

  const merged = mergeLists([
    savedList,
    watchedList,
    ...rows.filter(
      (list) =>
        list.$id !== savedList.$id &&
        list.$id !== watchedList.$id &&
        list.slug !== DEFAULT_SAVED_LIST_SLUG &&
        list.slug !== DEFAULT_WATCHED_LIST_SLUG,
    ),
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
};

export const createList = async (name: string): Promise<MovieList> => {
  const userId = await getCurrentUserId();
  const trimmedName = name.trim();
  const slug = slugify(trimmedName);

  if (!trimmedName || !slug) {
    throw new Error("List name is required.");
  }

  if ([DEFAULT_SAVED_LIST_SLUG, DEFAULT_WATCHED_LIST_SLUG].includes(slug)) {
    throw new Error("That list name is reserved.");
  }

  const existing = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: MOVIE_LISTS_TABLE_ID,
    queries: [
      Query.equal("user_id", userId),
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
      user_id: userId,
      name: trimmedName,
      slug,
      type: "custom",
      is_default: false,
    },
  });

  return row as unknown as MovieList;
};

export const getListItems = async (listId: string): Promise<ListItem[]> => {
  const userId = await getCurrentUserId();
  const savedList = await getDefaultSavedList(userId);
  const watchedList = await getDefaultWatchedList(userId);

  const resolvedListId =
    listId === DEFAULT_SAVED_LIST_ID ? savedList.$id : listId;
  const rows = await listRowsAll<ListItem>({
    tableId: LIST_ITEMS_TABLE_ID,
    queries: [
      Query.equal("user_id", userId),
      Query.equal("list_id", resolvedListId),
      Query.orderDesc("added_at"),
    ],
  });

  const sortedRows = rows.sort((left, right) =>
    right.added_at.localeCompare(left.added_at),
  );

  if (resolvedListId === watchedList.$id) {
    const historyRows = (await getWatchHistory("all")).map((entry) =>
      toListItemFromWatchHistoryEntry(entry, userId, watchedList.$id),
    );
    const historyByKey = new Map(
      historyRows.map((item) => [
        `${getRowMediaType(item)}:${getRowMediaId(item)}`,
        item,
      ]),
    );
    const seen = new Set<string>();

    return [...sortedRows, ...historyRows]
      .map((item) => {
        const key = `${getRowMediaType(item)}:${getRowMediaId(item)}`;
        const historyItem = historyByKey.get(key);

        if (!item.poster_url && historyItem?.poster_url) {
          return {
            ...item,
            poster_url: historyItem.poster_url,
            release_date: item.release_date ?? historyItem.release_date,
            vote_average: item.vote_average ?? historyItem.vote_average,
          };
        }

        return item;
      })
      .filter((item) => {
        const key = `${getRowMediaType(item)}:${getRowMediaId(item)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  if (resolvedListId !== savedList.$id) {
    return sortedRows;
  }

  const legacyRows = (await getSavedMetricsRows(userId)).map((row) =>
    toListItemFromMetricRow(row, userId),
  );
  const seen = new Set<string>();

  return [...sortedRows, ...legacyRows].filter((item) => {
    const key = `${getRowMediaType(item)}:${getRowMediaId(item)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const addMediaToList = async (
  listId: string,
  media: Movie | MovieDetails | TVShow | TVDetails,
  mediaType: MediaType = "movie",
): Promise<ListItem> => {
  const userId = await getCurrentUserId();

  const existingRows = await listRowsByMediaId<ListItem>({
    tableId: LIST_ITEMS_TABLE_ID,
    userId,
    mediaId: media.id,
    extraQueries: [Query.equal("list_id", listId)],
  });

  const existingMediaRow = existingRows.find((item) =>
    matchesMedia(item, media.id, mediaType),
  );
  if (existingMediaRow) {
    const metadata = {
      title: getMediaTitle(media),
      poster_url: toPosterUrl(media.poster_path),
      release_date: getMediaReleaseDate(media),
      vote_average: media.vote_average,
    };
    const repairPayload = getListItemMetadataRepairPayload({
      existing: existingMediaRow,
      next: metadata,
    });

    if (!repairPayload) {
      return existingMediaRow;
    }

    const repaired = await updateRowWithMediaFieldFallback({
      tableId: LIST_ITEMS_TABLE_ID,
      rowId: existingMediaRow.$id,
      mediaId: media.id,
      data: repairPayload,
    });

    return repaired as unknown as ListItem;
  }

  const created = await createRowWithMediaFieldFallback({
    tableId: LIST_ITEMS_TABLE_ID,
    mediaId: media.id,
    data: {
      user_id: userId,
      list_id: listId,
      media_type: mediaType,
      title: getMediaTitle(media),
      poster_url: toPosterUrl(media.poster_path),
      release_date: getMediaReleaseDate(media),
      vote_average: media.vote_average,
      added_at: new Date().toISOString(),
    },
  });

  return created as unknown as ListItem;
};

export const addMovieToList = (
  listId: string,
  movie: Movie | MovieDetails,
): Promise<ListItem> => addMediaToList(listId, movie, "movie");

export const removeMediaFromList = async (
  listId: string,
  mediaId: number,
  mediaType: MediaType = "movie",
): Promise<void> => {
  const userId = await getCurrentUserId();

  const existingRows = await listRowsByMediaId<ListItem>({
    tableId: LIST_ITEMS_TABLE_ID,
    userId,
    mediaId,
    extraQueries: [Query.equal("list_id", listId)],
  });

  const existingMediaRow = existingRows.find((item) =>
    matchesMedia(item, mediaId, mediaType),
  );
  if (!existingMediaRow) return;

  await tables.deleteRow({
    databaseId: DATABASE_ID,
    tableId: LIST_ITEMS_TABLE_ID,
    rowId: existingMediaRow.$id,
  });
};

export const removeMovieFromList = (
  listId: string,
  movieId: number,
): Promise<void> => removeMediaFromList(listId, movieId, "movie");

export const getMediaListStatus = async (
  mediaId: number,
  mediaType: MediaType = "movie",
): Promise<MovieListStatus> => {
  const userId = await getCurrentUserId();
  const [lists, itemsResult, metricRow] = await Promise.all([
    getLists(),
    getListItemsByMediaId(userId, mediaId, mediaType),
    getMetricsRowByMediaId(userId, mediaId, mediaType),
  ]);

  const savedList = lists.find((list) => list.slug === DEFAULT_SAVED_LIST_SLUG);
  const watchedList = lists.find(
    (list) => list.slug === DEFAULT_WATCHED_LIST_SLUG,
  );
  const customListIds = itemsResult
    .filter(
      (item) =>
        item.list_id !== savedList?.$id && item.list_id !== watchedList?.$id,
    )
    .map((item) => item.list_id);

  return {
    saved:
      Boolean(metricRow?.saved) ||
      itemsResult.some((item) => item.list_id === savedList?.$id),
    watched: watchedList
      ? itemsResult.some((item) => item.list_id === watchedList.$id)
      : false,
    watchedListId: watchedList?.$id ?? null,
    customListIds,
  };
};

export const getMovieListStatus = async (
  movieId: number,
): Promise<MovieListStatus> => getMediaListStatus(movieId, "movie");

export const saveMedia = async (
  media: MovieDetails | TVDetails,
  mediaType: MediaType = "movie",
): Promise<TrendingMovie> => {
  const userId = await getCurrentUserId();
  const savedList = await getDefaultSavedList(userId);
  await addMediaToList(savedList.$id, media, mediaType);

  const existing = await getMetricsRowByMediaId(userId, media.id, mediaType);

  if (existing) {
    const result = await updateRowWithMediaFieldFallback({
      tableId: SEARCH_METRICS_TABLE_ID,
      rowId: existing.$id,
      mediaId: media.id,
      data: {
        user_id: userId,
        searchTerm: existing.searchTerm || getMediaTitle(media),
        count: existing.count ?? 0,
        media_type: mediaType,
        title: getMediaTitle(media),
        poster_url: toPosterUrl(media.poster_path),
        release_date: getMediaReleaseDate(media),
        vote_average: media.vote_average,
        saved: true,
      },
    });

    return result as unknown as TrendingMovie;
  }

  const result = await createRowWithMediaFieldFallback({
    tableId: SEARCH_METRICS_TABLE_ID,
    mediaId: media.id,
    data: {
      user_id: userId,
      searchTerm: getMediaTitle(media),
      count: 0,
      media_type: mediaType,
      title: getMediaTitle(media),
      poster_url: toPosterUrl(media.poster_path),
      release_date: getMediaReleaseDate(media),
      vote_average: media.vote_average,
      saved: true,
    },
  });

  return result as unknown as TrendingMovie;
};

export const saveMovie = (movie: MovieDetails): Promise<TrendingMovie> =>
  saveMedia(movie, "movie");

export const removeSavedMedia = async (
  mediaId: number,
  mediaType: MediaType = "movie",
): Promise<void> => {
  const userId = await getCurrentUserId();
  const savedList = await getDefaultSavedList(userId);
  await removeMediaFromList(savedList.$id, mediaId, mediaType);

  const existing = await getMetricsRowByMediaId(userId, mediaId, mediaType);
  if (!existing) return;

  await updateRowWithMediaFieldFallback({
    tableId: SEARCH_METRICS_TABLE_ID,
    rowId: existing.$id,
    mediaId,
    data: { saved: false },
  });
};

export const removeSavedMovie = (movieId: number): Promise<void> =>
  removeSavedMedia(movieId, "movie");

export const markMediaWatched = async (
  media: Movie | MovieDetails | TVShow | TVDetails,
  mediaType: MediaType = "movie",
): Promise<void> => {
  const userId = await getCurrentUserId();
  const watchedList = await getDefaultWatchedList(userId);

  const existingRows = await listRowsByMediaId<WatchHistoryEntry>({
    tableId: WATCH_HISTORY_TABLE_ID,
    userId,
    mediaId: media.id,
  });

  const existingMediaRow = existingRows.find((entry) =>
    matchesMedia(entry, media.id, mediaType),
  );

  if (!existingMediaRow) {
    await createRowWithMediaFieldFallback({
      tableId: WATCH_HISTORY_TABLE_ID,
      mediaId: media.id,
      data: {
        user_id: userId,
        media_type: mediaType,
        title: getMediaTitle(media),
        poster_url: toPosterUrl(media.poster_path),
        vote_average: media.vote_average,
        release_date: getMediaReleaseDate(media),
        watched_at: new Date().toISOString(),
      },
    });
  }

  await addMediaToList(watchedList.$id, media, mediaType);
};

export const markMovieWatched = (movie: Movie | MovieDetails): Promise<void> =>
  markMediaWatched(movie, "movie");

export const getWatchHistory = async (
  range: ProfileRange = "all",
): Promise<WatchHistoryEntry[]> => {
  const userId = await getCurrentUserId();
  const rows = await listRowsAll<WatchHistoryEntry>({
    tableId: WATCH_HISTORY_TABLE_ID,
    queries: [Query.equal("user_id", userId), Query.orderDesc("watched_at")],
  });

  const seen = new Set<string>();
  return rows
    .filter((entry) => {
      const key = `${getRowMediaType(entry)}:${getRowMediaId(entry)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((entry) => isWithinRange(entry.watched_at, range));
};

export const getProfileStats = async (
  range: ProfileRange = "all",
): Promise<ProfileStats> => {
  const userId = await getCurrentUserId();

  const [lists, allItemsResult, allWatchHistory, savedMetricsRows] =
    await Promise.all([
      getLists(),
      listRowsAll<ListItem>({
        tableId: LIST_ITEMS_TABLE_ID,
        queries: [Query.equal("user_id", userId)],
      }),
      getWatchHistory("all"),
      getSavedMetricsRows(userId),
    ]);

  const filteredWatchHistory = allWatchHistory.filter((entry) =>
    isWithinRange(entry.watched_at, range),
  );
  const watchedList = lists.find(
    (list) => list.slug === DEFAULT_WATCHED_LIST_SLUG,
  );
  const savedMediaIds = new Set([
    ...savedMetricsRows.map(
      (item) => `${getRowMediaType(item)}:${getRowMediaId(item)}`,
    ),
    ...allItemsResult
      .filter((item) => item.list_id !== watchedList?.$id)
      .map((item) => `${getRowMediaType(item)}:${getRowMediaId(item)}`),
  ]);

  return {
    saved: savedMediaIds.size,
    watched: allWatchHistory.length,
    lists: lists.length,
    range,
    chart: buildChartBuckets(filteredWatchHistory, range),
  };
};
