import { images } from "@/constants/images";
import { fetchMovieDetails } from "@/services/api";
import {
  getListItems,
  getLists,
  getProfileStats,
  getUserProfile,
  getWatchHistory,
} from "@/services/appwrite";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ranges: { label: string; value: ProfileRange }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const sections = [
  { label: "Activity", value: "activity" },
  { label: "Watched", value: "watched" },
  { label: "Watchlist", value: "watchlist" },
] as const;

const emptyStats: ProfileStats = {
  saved: 0,
  watched: 0,
  lists: 0,
  range: "week",
  chart: [],
};

const getInitial = (name?: string) => (name?.trim()?.charAt(0) || "M").toUpperCase();

const formatHours = (minutes: number) => {
  if (!minutes) return "0";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
};

const filterHistoryByRange = (
  history: WatchHistoryEntry[],
  range: ProfileRange,
) => {
  const now = new Date();
  const start = new Date(now);

  if (range === "week") {
    start.setDate(now.getDate() - 6);
  } else if (range === "month") {
    start.setDate(now.getDate() - 27);
  } else {
    return history;
  }

  start.setHours(0, 0, 0, 0);
  return history.filter((entry) => new Date(entry.watched_at) >= start);
};

const getWatchMinutes = (
  history: WatchHistoryEntry[],
  detailsById: Record<number, MovieDetails>,
) =>
  history.reduce(
    (total, entry) => total + (detailsById[entry.movie_id]?.runtime ?? 0),
    0,
  );

const getGenreBreakdown = (
  history: WatchHistoryEntry[],
  detailsById: Record<number, MovieDetails>,
) => {
  const counts = new Map<string, number>();

  history.forEach((entry) => {
    const genres = detailsById[entry.movie_id]?.genres ?? [];
    genres.forEach((genre) => {
      counts.set(genre.name, (counts.get(genre.name) ?? 0) + 1);
    });
  });

  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }));
};

const genreTone: Record<string, string> = {
  Drama: "#5F9EA0",
  Comedy: "#E77023",
  Action: "#D47373",
  Thriller: "#88A0B0",
  Romance: "#3AB0FF",
  "Science Fiction": "#4FD1C5",
  Horror: "#F87171",
  Adventure: "#F59E0B",
  Animation: "#60A5FA",
  Crime: "#A78BFA",
};

const chartHorizontalPadding = 10;
const chartHeight = 140;

const getChartPoints = (chart: ChartBucket[], chartWidth: number) => {
  const maxValue = Math.max(...chart.map((bucket) => bucket.value), 1);
  const usableHeight = chartHeight - 28;
  const usableWidth = Math.max(chartWidth - chartHorizontalPadding * 2, 0);
  const stepX =
    chart.length > 1
      ? usableWidth / (chart.length - 1)
      : usableWidth;

  return chart.map((bucket, index) => {
    const x = chartHorizontalPadding + index * stepX;
    const y = chartHeight - 18 - (bucket.value / maxValue) * usableHeight;

    return {
      ...bucket,
      x,
      y: Number.isFinite(y) ? y : chartHeight - 18,
    };
  });
};

const Profiles = () => {
  const isFocused = useIsFocused();
  const [range, setRange] = useState<ProfileRange>("week");
  const [section, setSection] = useState<(typeof sections)[number]["value"]>(
    "activity",
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>(emptyStats);
  const [allWatchHistory, setAllWatchHistory] = useState<WatchHistoryEntry[]>([]);
  const [watchDetailsById, setWatchDetailsById] = useState<
    Record<number, MovieDetails>
  >({});
  const [lists, setLists] = useState<MovieList[]>([]);
  const [itemsByList, setItemsByList] = useState<Record<string, ListItem[]>>({});
  const [chartWidth, setChartWidth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogDashboard = async () => {
      try {
        setLoading(true);

        const [profileResult, statsResult, watchHistoryResult, listsResult] =
          await Promise.allSettled([
            getUserProfile(),
            getProfileStats(range),
            getWatchHistory("all"),
            getLists(),
          ]);

        const loadedProfile =
          profileResult.status === "fulfilled" ? profileResult.value : null;
        const loadedStats =
          statsResult.status === "fulfilled" ? statsResult.value : emptyStats;
        const loadedWatchHistory =
          watchHistoryResult.status === "fulfilled" ? watchHistoryResult.value : [];
        const loadedLists =
          listsResult.status === "fulfilled" ? listsResult.value : [];

        setProfile(loadedProfile);
        setStats({ ...loadedStats, range });
        setAllWatchHistory(loadedWatchHistory);
        setLists(loadedLists);

        const listEntries = await Promise.all(
          loadedLists.map(async (list) => [list.$id, await getListItems(list.$id)] as const),
        );
        setItemsByList(Object.fromEntries(listEntries));

        const uniqueMovieIds = [...new Set(loadedWatchHistory.map((item) => item.movie_id))];
        const detailsResults = await Promise.allSettled(
          uniqueMovieIds.map((movieId) => fetchMovieDetails(String(movieId))),
        );

        const nextDetails: Record<number, MovieDetails> = {};

        detailsResults.forEach((result) => {
          if (result.status === "fulfilled") {
            nextDetails[result.value.id] = result.value;
          }
        });

        setWatchDetailsById(nextDetails);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      loadLogDashboard();
    }
  }, [isFocused, range]);

  const chart = stats.chart ?? [];
  const chartPoints = getChartPoints(chart, chartWidth);
  const rangedHistory = filterHistoryByRange(allWatchHistory, range);
  const allWatchMinutes = getWatchMinutes(allWatchHistory, watchDetailsById);
  const rangeWatchMinutes = getWatchMinutes(rangedHistory, watchDetailsById);
  const topGenres = getGenreBreakdown(rangedHistory, watchDetailsById);
  const savedList = lists.find((list) => list.slug === "saved-list");
  const savedItems = savedList ? itemsByList[savedList.$id] ?? [] : [];
  const customLists = lists.filter((list) => list.type === "custom");

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 66 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#E77023" className="mt-20 self-center" />
        ) : (
          <>
            <View className="px-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-3">
                  <View className="size-16 items-center justify-center rounded-full border-2 border-accentLight bg-accentLight/10">
                    <Text className="text-2xl font-bold text-accentLight">
                      {getInitial(profile?.name)}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-2xl font-bold text-white" numberOfLines={1}>
                      {profile?.name || "Movie Tracker"}
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-[#9FD6E3]" numberOfLines={2}>
                      {profile?.bio || "Building a personal media log."}
                    </Text>
                  </View>
                </View>

                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-accentLight">
                  Home
                </Text>
              </View>

              <View className="mt-6 flex-row items-center justify-between px-2">
                {[
                  { label: "Films", value: String(allWatchHistory.length) },
                  { label: "Hours", value: formatHours(allWatchMinutes) },
                  { label: "Lists", value: String(stats.lists) },
                ].map((item) => (
                  <View key={item.label} className="items-center">
                    <Text
                      className={`text-4xl font-bold ${
                        item.label === "Hours" ? "text-[#9FD6E3]" : "text-white"
                      }`}
                    >
                      {item.value}
                    </Text>
                    <Text className="mt-1 text-sm text-white/70">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-6">
              <View className="flex-row items-center justify-between border-b border-white/10">
                {sections.map((item) => {
                  const active = item.value === section;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      className="flex-1 pb-3"
                      onPress={() => setSection(item.value)}
                    >
                      <Text
                        className={`text-center text-lg font-bold ${
                          active ? "text-[#9FD6E3]" : "text-white/70"
                        }`}
                      >
                        {item.label}
                      </Text>
                      <View
                        className={`mt-3 h-0.5 rounded-full ${
                          active ? "bg-accentLight" : "bg-transparent"
                        }`}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {section === "activity" ? (
              <>
                <View className="mt-5 flex-row gap-x-2">
                  {ranges.map((item) => {
                    const active = item.value === range;

                    return (
                      <TouchableOpacity
                        key={item.value}
                        className={`flex-1 rounded-2xl px-3 py-3 ${
                          active ? "bg-accentLight" : "bg-white/5"
                        }`}
                        onPress={() => setRange(item.value)}
                      >
                        <Text
                        className={`text-center text-sm font-semibold ${
                          active ? "text-white" : "text-white/75"
                        }`}
                      >
                        {item.label}
                      </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="mt-5 flex-row items-end justify-between px-1">
                  <View>
                    <Text className="text-4xl font-bold text-white">
                      {rangedHistory.length}
                    </Text>
                    <Text className="mt-2 text-sm text-white/70">Films watched</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-4xl font-bold text-[#9FD6E3]">
                      {formatHours(rangeWatchMinutes)}
                      <Text className="text-lg text-white/70">h</Text>
                    </Text>
                    <Text className="mt-2 text-sm text-white/70">Watch time</Text>
                  </View>
                </View>

                <View className="mt-6 px-1">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-xl font-bold text-white">Watch Activity</Text>
                      <Text className="mt-1 text-sm text-white/65">
                        {range === "week"
                          ? "7 days"
                          : range === "month"
                            ? "4 weeks"
                            : "6 months"}
                      </Text>
                    </View>
                    <View className="rounded-full bg-accentLight/15 px-3 py-1.5">
                      <Text className="text-xs font-semibold text-accentLight">
                        {rangedHistory.length} total
                      </Text>
                    </View>
                  </View>

                  <View className="mt-6 border-t border-white/10 pt-5">
                    <View
                      className="overflow-hidden rounded-[28px] border border-white/6 bg-white/[0.03] px-3 py-4"
                    >
                      <View
                        style={{ height: chartHeight }}
                        onLayout={(event) =>
                          setChartWidth(event.nativeEvent.layout.width)
                        }
                      >
                        {[0, 1, 2, 3].map((index) => (
                          <View
                            key={`grid-${index}`}
                            className="absolute inset-x-0 border-t border-white/6"
                            style={{ top: index * ((chartHeight - 20) / 3) + 8 }}
                          />
                        ))}

                        <View className="absolute inset-x-0 bottom-4 h-px bg-white/12" />

                        {chartPoints.slice(0, -1).map((point, index) => {
                          const nextPoint = chartPoints[index + 1];
                          const deltaX = nextPoint.x - point.x;
                          const deltaY = nextPoint.y - point.y;
                          const width = Math.sqrt(deltaX ** 2 + deltaY ** 2);
                          const angle = `${(Math.atan2(deltaY, deltaX) * 180) / Math.PI}deg`;

                          return (
                            <View
                              key={`${point.label}-line-${nextPoint.label}`}
                              className="absolute h-[3px] rounded-full bg-accentLight"
                              style={{
                                left: point.x + deltaX / 2 - width / 2,
                                top: point.y + deltaY / 2 - 1.5,
                                width,
                                shadowColor: "#3AB0FF",
                                shadowOpacity: 0.35,
                                shadowRadius: 6,
                                transform: [{ rotate: angle }],
                              }}
                            />
                          );
                        })}

                        {chartPoints.map((point) => (
                          <View
                            key={`${point.label}-point`}
                            className="absolute items-center"
                            style={{ left: point.x - 12, top: point.y - 24 }}
                          >
                            {point.value > 0 ? (
                              <Text className="mb-2 text-[11px] font-semibold text-accentLight">
                                {point.value}
                              </Text>
                            ) : (
                              <View className="mb-2 h-[14px]" />
                            )}
                            <View className="size-3 items-center justify-center rounded-full bg-accentLight/20">
                              <View className="size-1.5 rounded-full bg-accentLight" />
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View className="mt-5 flex-row justify-between px-1">
                      {chart.map((bucket) => (
                        <Text
                          key={bucket.label}
                          className="text-xs font-medium text-white/65"
                        >
                          {bucket.label}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>

                <View className="mt-8 px-1">
                  <Text className="text-xl font-bold text-white">Top Genres</Text>
                  {topGenres.length > 0 ? (
                    <View className="mt-4 gap-y-4">
                      {topGenres.map((genre) => (
                        <View key={genre.name}>
                          <View className="flex-row items-center justify-between">
                          <Text className="text-base font-medium text-white">{genre.name}</Text>
                          <Text className="text-sm text-secondary">
                            {genre.percentage}%
                          </Text>
                        </View>
                        <View className="mt-2 h-1.5 rounded-full bg-[#0F1725]">
                          <View
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.max(genre.percentage, 10)}%`,
                                backgroundColor: genreTone[genre.name] || "#3AB0FF",
                              }}
                          />
                        </View>
                      </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="mt-3 leading-5 text-white/70">
                      Genre trends will appear after you mark more films as watched.
                    </Text>
                  )}
                </View>
              </>
            ) : null}

            {section === "watched" ? (
              <View className="mt-4 rounded-[26px] border border-white/10 bg-[#141D2D]/95 px-4 py-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-bold text-white">Recently Watched</Text>
                  <Text className="text-sm text-accentLight">{allWatchHistory.length} films</Text>
                </View>

                {allWatchHistory.length > 0 ? (
                  <View className="mt-4 gap-y-3">
                    {allWatchHistory.slice(0, 8).map((item) => {
                      const details = watchDetailsById[item.movie_id];

                      return (
                        <View
                          key={item.$id}
                          className="flex-row items-center rounded-[22px] border border-white/10 bg-[#0F1725] px-3 py-3"
                        >
                          <Image
                            source={{
                              uri: item.poster_url || "https://placehold.co/600x400/1a1a1a.png",
                            }}
                            className="h-20 w-14 rounded-xl"
                            resizeMode="cover"
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-base font-semibold text-white" numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text className="mt-1 text-sm text-accent">
                              {new Date(item.watched_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Text>
                            <Text className="mt-2 text-xs text-white/65" numberOfLines={2}>
                              {details?.genres?.map((genre) => genre.name).join(" • ") ||
                                "Genres unavailable"}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-sm font-semibold text-accentLight">
                              {Math.round(item.vote_average ?? 0)}/10
                            </Text>
                            <Text className="mt-2 text-xs text-white/65">
                              {details?.runtime ? `${details.runtime}m` : "Logged"}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text className="mt-4 leading-5 text-white/70">
                    Mark titles as watched from the movie details page to start your log.
                  </Text>
                )}
              </View>
            ) : null}

            {section === "watchlist" ? (
              <>
                <View className="mt-4 rounded-[26px] border border-white/10 bg-[#141D2D]/95 px-4 py-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-white">Saved Queue</Text>
                    <Text className="text-sm text-accentLight">{savedItems.length} saved</Text>
                  </View>

                  {savedItems.length > 0 ? (
                    <View className="mt-4 gap-y-3">
                      {savedItems.slice(0, 5).map((item) => (
                        <View
                          key={item.$id}
                          className="flex-row items-center rounded-[22px] border border-white/10 bg-[#0F1725] px-3 py-3"
                        >
                          <Image
                            source={{
                              uri: item.poster_url || "https://placehold.co/600x400/1a1a1a.png",
                            }}
                            className="h-20 w-14 rounded-xl"
                            resizeMode="cover"
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-base font-semibold text-white" numberOfLines={1}>
                              {item.title}
                            </Text>
                              <Text className="mt-1 text-sm text-[#9FD6E3]">
                                {item.release_date?.split("-")[0] || "Saved"}
                              </Text>
                            </View>
                          <Text className="text-sm text-white/65">
                            {item.vote_average ? `${Math.round(item.vote_average)}/10` : ""}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="mt-4 leading-5 text-white/70">
                      Use the bookmark button on a movie to save it to your default queue.
                    </Text>
                  )}
                </View>

                <View className="mt-4 rounded-[26px] border border-white/10 bg-[#141D2D]/95 px-4 py-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-white">Custom Lists</Text>
                    <Text className="text-sm text-accent">{customLists.length} lists</Text>
                  </View>

                  {customLists.length > 0 ? (
                    <View className="mt-4 gap-y-3">
                      {customLists.map((list) => {
                        const items = itemsByList[list.$id] ?? [];

                        return (
                          <View
                            key={list.$id}
                            className="rounded-[22px] border border-white/10 bg-[#0F1725] px-4 py-4"
                          >
                            <View className="flex-row items-center justify-between">
                              <Text className="text-base font-semibold text-white">{list.name}</Text>
                              <Text className="text-sm text-accentLight">
                                {items.length} items
                              </Text>
                            </View>
                            <Text className="mt-2 text-sm text-white/65" numberOfLines={1}>
                              {items.length > 0
                                ? items
                                    .slice(0, 3)
                                    .map((item) => item.title)
                                    .join(" • ")
                                : "No titles added yet"}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text className="mt-4 leading-5 text-white/70">
                      Create custom lists from the Saved tab to organize themed watchlists.
                    </Text>
                  )}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Profiles;
