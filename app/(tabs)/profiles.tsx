import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import {
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

const Profiles = () => {
  const isFocused = useIsFocused();
  const [range, setRange] = useState<ProfileRange>("week");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recentWatched, setRecentWatched] = useState<WatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileResult, statsResult, watchHistoryResult] =
          await Promise.allSettled([
          getUserProfile(),
          getProfileStats(range),
          getWatchHistory("all"),
        ]);

        const profileRow =
          profileResult.status === "fulfilled" ? profileResult.value : null;
        const profileStats =
          statsResult.status === "fulfilled"
            ? statsResult.value
            : { saved: 0, watched: 0, lists: 0, range, chart: [] };
        const watchHistory =
          watchHistoryResult.status === "fulfilled" ? watchHistoryResult.value : [];

        if (profileResult.status === "rejected") {
          console.error("Error loading user profile:", profileResult.reason);
        }
        if (statsResult.status === "rejected") {
          console.error("Error loading profile stats:", statsResult.reason);
        }
        if (watchHistoryResult.status === "rejected") {
          console.error("Error loading watch history:", watchHistoryResult.reason);
        }

        setProfile(profileRow);
        setStats(profileStats);
        setRecentWatched(watchHistory.slice(0, 5));
      } catch (loadError) {
        console.error("Unexpected error loading profile dashboard:", loadError);
        setProfile(null);
        setStats({ saved: 0, watched: 0, lists: 0, range, chart: [] });
        setRecentWatched([]);
        setError("Failed to load some profile data.");
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      loadProfileDashboard();
    }
  }, [isFocused, range]);

  const chart = stats?.chart ?? [];
  const maxValue = Math.max(...chart.map((bucket) => bucket.value), 1);

  return (
    <View className="bg-primary flex-1">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 120 }}
      >
        <Image
          source={icons.movie}
          resizeMode="contain"
          style={styles.movieIcon}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            className="mt-10 self-center"
          />
        ) : error ? (
          <Text className="mt-10 text-white">{error}</Text>
        ) : (
          <>
            <View className="rounded-[28px] bg-primary px-5 py-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-text text-sm">Profile</Text>
                  <Text className="mt-2 text-3xl font-bold text-text">
                    {profile?.name || "Movie Tracker"}
                  </Text>
                  <Text className="mt-2 leading-5 text-accent">
                    {profile?.bio ||
                      "Track what you watch, build custom lists, and review your recent activity."}
                  </Text>
                </View>

                <View className="size-20 items-center justify-center rounded-full bg-slateGrey">
                  <Image
                    source={icons.profile}
                    className="size-8"
                    tintColor="#F8F8F8"
                  />
                </View>
              </View>

              <View className="mt-6 flex-row rounded-2xl border border-white/10 bg-slateGrey/80 py-4">
                {[
                  { label: "Saved", value: stats?.saved ?? 0 },
                  { label: "Watched", value: stats?.watched ?? 0 },
                  { label: "Lists", value: stats?.lists ?? 0 },
                ].map((stat) => (
                  <View key={stat.label} className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-white">
                      {stat.value}
                    </Text>
                    <Text className="mt-1 text-sm font-bold text-secondary">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-8 rounded-[28px] border border-white/10 bg-[#18232B]/90 px-5 py-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-bold text-white">
                    Watched Activity
                  </Text>
                  <Text className="mt-1 text-accent">
                    {range === "week"
                      ? "Daily view"
                      : range === "month"
                        ? "Weekly totals"
                        : "Monthly totals"}
                  </Text>
                </View>
                <View className="rounded-full bg-white/5 px-3 py-1">
                  <Text className="text-accentLight text-xs font-semibold">
                    {stats?.watched ?? 0} total watched
                  </Text>
                </View>
              </View>

              <View className="mt-5 flex-row gap-x-2">
                {ranges.map((item) => {
                  const active = item.value === range;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      className={`flex-1 rounded-full px-3 py-2 ${
                        active ? "bg-accentLight" : "bg-white/5"
                      }`}
                      onPress={() => setRange(item.value)}
                    >
                      <Text
                        className={`text-center text-xs font-semibold ${
                          active ? "text-white" : "text-accent"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {chart.some((bucket) => bucket.value > 0) ? (
                <View className="mt-6">
                  <View className="h-40 flex-row items-end justify-between gap-x-3">
                    {chart.map((bucket) => (
                      <View key={bucket.label} className="flex-1 items-center">
                        <Text className="mb-2 text-xs font-semibold text-accentLight">
                          {bucket.value}
                        </Text>
                        <View className="h-28 w-full justify-end rounded-t-2xl bg-white/5 px-1 pb-1">
                          <View
                            className="w-full rounded-t-2xl bg-accentLight"
                            style={{
                              height: `${Math.max((bucket.value / maxValue) * 100, 8)}%`,
                            }}
                          />
                        </View>
                        <Text className="mt-2 text-xs text-secondary">
                          {bucket.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="mt-6 rounded-2xl border border-white/10 bg-primary/40 px-4 py-5">
                  <Text className="text-lg font-semibold text-white">
                    No watched activity yet
                  </Text>
                  <Text className="mt-2 leading-5 text-light-200">
                    Mark movies as watched from the details screen to populate
                    this chart.
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-8 rounded-[28px] border border-white/10 bg-white/5 px-5 py-5">
              <Text className="text-xl font-bold text-white">
                Recent Watched
              </Text>

              {recentWatched.length > 0 ? (
                <View className="mt-4 gap-y-3">
                  {recentWatched.map((item) => (
                    <View
                      key={item.$id}
                      className="flex-row items-center rounded-2xl border border-white/10 bg-primary/40 px-3 py-3"
                    >
                      <Image
                        source={{
                          uri:
                            item.poster_url ||
                            "https://placehold.co/600x400/1a1a1a.png",
                        }}
                        className="h-16 w-12 rounded-lg"
                        resizeMode="cover"
                      />
                      <View className="ml-3 flex-1">
                        <Text
                          className="text-base font-semibold text-white"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text className="mt-1 text-sm text-accent">
                          Watched on{" "}
                          {new Date(item.watched_at).toLocaleDateString(
                            "en-US",
                          )}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="mt-4 rounded-2xl border border-white/10 bg-primary/40 px-4 py-5">
                  <Text className="text-white">
                    Your watched history will appear here.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Profiles;

const styles = StyleSheet.create({
  movieIcon: {
    width: 48,
    height: 40,
    marginTop: 80,
    marginBottom: 20,
    alignSelf: "center",
  },
});
