import FrameLogWordmark from "@/components/FrameLogWordmark";
import { icons } from "@/constants/icon";
import { fetchTvDetails } from "@/services/api";
import {
    addMediaToList,
    getLists,
    getMediaListStatus,
    markMediaWatched,
    removeMediaFromList,
    removeSavedMedia,
    saveMedia,
} from "@/services/appwrite";
import { useFetch } from "@/services/useFetch";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const genreColors: Record<string, string> = {
  Action: "#D47373",
  Adventure: "#E77023",
  Animation: "#4DA8FF",
  Comedy: "#F3B95F",
  Crime: "#8A7CFF",
  Documentary: "#5F9EA0",
  Drama: "#3AB0FF",
  Family: "#4FD1C5",
  Fantasy: "#C084FC",
  History: "#88A0B0",
  Horror: "#F87171",
  Mystery: "#60A5FA",
  Romance: "#F472B6",
  "Science Fiction": "#22D3EE",
  Thriller: "#F59E0B",
  War: "#94A3B8",
};

const metadataPill = (label: string) => (
  <View key={label} className="rounded-full bg-primary/70 px-3 py-2">
    <Text className="text-xs font-semibold text-white">{label}</Text>
  </View>
);

const ActionIconLabel = ({ icon, label }: { icon: string; label: string }) => (
  <View className="flex-row items-center justify-center">
    <Text className="mr-2 text-lg font-semibold text-white">{icon}</Text>
    <Text className="text-center font-semibold text-white">{label}</Text>
  </View>
);

const CastCard = ({
  name,
  role,
  image,
}: {
  name: string;
  role: string;
  image?: string | null;
}) => (
  <View className="mr-5 w-24 items-center">
    <Image
      source={{
        uri: image
          ? `https://image.tmdb.org/t/p/w185${image}`
          : "https://placehold.co/160x220/1a2232/ffffff.png",
      }}
      className="size-20 rounded-full border border-white/10"
      resizeMode="cover"
    />
    <Text
      className="mt-3 text-center text-sm font-semibold text-white"
      numberOfLines={2}
    >
      {name}
    </Text>
    <Text
      className="mt-1 text-center text-xs text-accentLight/80"
      numberOfLines={2}
    >
      {role}
    </Text>
  </View>
);

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
};

const TvDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: show, loading } = useFetch(() => fetchTvDetails(id as string));
  const [saved, setSaved] = useState(false);
  const [watched, setWatched] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [expandedOverview, setExpandedOverview] = useState(false);
  const [customLists, setCustomLists] = useState<MovieList[]>([]);
  const [showCustomListIds, setShowCustomListIds] = useState<string[]>([]);
  const [showListPicker, setShowListPicker] = useState(false);
  const [listPickerLoading, setListPickerLoading] = useState(false);

  useEffect(() => {
    const loadShowState = async () => {
      if (!show?.id) return;

      try {
        const [status, allLists] = await Promise.all([
          getMediaListStatus(show.id, "tv"),
          getLists(),
        ]);
        setSaved(status.saved);
        setWatched(status.watched);
        setShowCustomListIds(status.customListIds);
        setCustomLists(allLists.filter((list) => list.type === "custom"));
      } catch {}
    };

    loadShowState();
  }, [show?.id]);

  const topCast = useMemo(
    () => show?.credits?.cast?.slice(0, 6) ?? [],
    [show?.credits?.cast],
  );
  const topCrew = useMemo(() => {
    const crew = show?.credits?.crew ?? [];
    const preferredJobs = [
      "Creator",
      "Executive Producer",
      "Writer",
      "Producer",
    ];
    const selected = preferredJobs
      .map((job) => crew.find((person) => person.job === job))
      .filter(Boolean);

    return selected.slice(0, 4) as NonNullable<TVDetails["credits"]>["crew"];
  }, [show?.credits?.crew]);

  const metadata = [
    show?.first_air_date?.split("-")[0],
    show?.episode_run_time?.[0]
      ? `${show.episode_run_time[0]}m episodes`
      : null,
    show?.number_of_seasons
      ? `${show.number_of_seasons} ${show.number_of_seasons === 1 ? "season" : "seasons"}`
      : null,
    show?.status || null,
    show?.spoken_languages?.[0]?.english_name ?? null,
  ].filter(Boolean) as string[];

  const handleDefaultSavePress = async () => {
    if (!show || saveLoading) return;

    try {
      setSaveLoading(true);
      if (saved) {
        await removeSavedMedia(show.id, "tv");
        setSaved(false);
      } else {
        await saveMedia(show, "tv");
        setSaved(true);
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The TV show could not be updated right now.",
      );
      console.error("saveMedia(tv) failed", error);
      Alert.alert("Save failed", message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMarkWatched = async () => {
    if (!show || watchLoading) return;

    try {
      setWatchLoading(true);
      await markMediaWatched(show, "tv");
      setWatched(true);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The TV show could not be marked as watched.",
      );
      console.error("markMediaWatched(tv) failed", error);
      Alert.alert("Watch update failed", message);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleToggleCustomList = async (list: MovieList) => {
    if (!show || listPickerLoading) return;
    const isInList = showCustomListIds.includes(list.$id);

    try {
      setListPickerLoading(true);
      if (isInList) {
        await removeMediaFromList(list.$id, show.id, "tv");
        setShowCustomListIds((current) =>
          current.filter((listId) => listId !== list.$id),
        );
      } else {
        await addMediaToList(list.$id, show, "tv");
        setShowCustomListIds((current) => [...current, list.$id]);
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The list could not be updated right now.",
      );
      console.error("toggleTvCustomList failed", error);
      Alert.alert("List update failed", message);
    } finally {
      setListPickerLoading(false);
    }
  };

  if (loading || !show) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <ActivityIndicator size="large" color="#3AB0FF" className="mt-24" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="relative h-[700px]">
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w780${
                show.backdrop_path || show.poster_path
              }`,
            }}
            className="h-full w-full"
            resizeMode="cover"
          />

          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "transparent"]}
            className="absolute left-0 right-0 top-0 h-52"
          />
          <LinearGradient
            colors={[
              "transparent",
              "rgba(12,20,32,0.15)",
              "rgba(12,20,32,0.72)",
              "#0C1420",
            ]}
            locations={[0, 0.38, 0.65, 1]}
            className="absolute inset-0"
          />

          <SafeAreaView className="absolute left-0 right-0 top-0 px-5 pt-2">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="size-11 items-center justify-center rounded-full border border-white/15 bg-[#111A28]/70"
                onPress={router.back}
              >
                <Text className="text-3xl font-semibold text-white">‹</Text>
              </TouchableOpacity>

              <FrameLogWordmark scale={1.15} />

              <TouchableOpacity
                className="size-11 items-center justify-center rounded-full border border-white/15 bg-[#111A28]/70"
                onPress={handleDefaultSavePress}
              >
                <Image
                  source={icons.saved}
                  className="size-6"
                  tintColor={saved ? "#3AB0FF" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View className="absolute bottom-0 left-0 right-0 px-5 pt-24">
            <Text
              className="max-w-[88%] text-4xl font-bold leading-tight text-white"
              style={{
                textShadowColor: "rgba(0,0,0,0.95)",
                textShadowOffset: { width: 0, height: 5 },
                textShadowRadius: 22,
              }}
            >
              {show.name}
            </Text>

            <View className="-mx-5 px-5 pb-8 pt-4">
              {show.tagline ? (
                <Text
                  className="text-sm italic text-[#D7F2F8]"
                  numberOfLines={2}
                  style={{
                    textShadowColor: "rgba(0,0,0,0.7)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 8,
                  }}
                >
                  {show.tagline}
                </Text>
              ) : null}

              <View className="mt-3 flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center rounded-full bg-amber-500/20 px-3 py-2">
                  <Text className="mr-1 text-sm text-amber-400">★</Text>
                  <Text className="text-sm font-bold text-amber-300">
                    {show.vote_average.toFixed(1)}
                  </Text>
                  <Text className="ml-0.5 text-xs text-white/50">/10</Text>
                </View>
                {metadata.map((item) => metadataPill(item))}
              </View>

              <View className="mt-4 flex-row flex-wrap gap-2">
                {show.genres?.slice(0, 5).map((genre) => (
                  <View
                    key={genre.id}
                    className="rounded-full px-3 py-2"
                    style={{
                      backgroundColor: genreColors[genre.name] || "#3AB0FF",
                    }}
                  >
                    <Text className="text-xs font-semibold text-white">
                      {genre.name}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="mt-6 flex-row gap-x-3">
                <TouchableOpacity
                  className={`flex-1 rounded-2xl px-4 py-3.5 ${
                    saved ? "bg-accentLight" : "bg-[#1A2740]/90"
                  }`}
                  onPress={handleDefaultSavePress}
                >
                  <ActionIconLabel
                    icon="+"
                    label={
                      saveLoading
                        ? "Saving..."
                        : saved
                          ? "In My List"
                          : "My List"
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-2xl px-4 py-3.5 ${
                    watched ? "bg-[#5F9EA0]" : "bg-[#1A2740]/90"
                  }`}
                  onPress={handleMarkWatched}
                >
                  <ActionIconLabel
                    icon="✓"
                    label={watchLoading ? "Updating..." : "Watched"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-14 items-center justify-center rounded-2xl bg-[#1A2740]/90 py-3.5"
                  onPress={() => setShowListPicker(true)}
                >
                  <Text className="text-lg font-semibold text-white">☰</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-[#0C1420] px-5 pt-8">
          <Text
            className="text-base leading-8 text-white"
            numberOfLines={expandedOverview ? undefined : 4}
          >
            {show.overview || "No overview is available for this show yet."}
          </Text>
          <View className="mt-3 flex-row justify-end">
            <TouchableOpacity
              onPress={() => setExpandedOverview((current) => !current)}
            >
              <Text className="text-sm font-semibold text-[#9FD6E3]">
                {expandedOverview ? "Show Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-7">
            <Text className="text-lg font-bold text-white">
              Top Cast & Crew
            </Text>

            {topCast.length > 0 ? (
              <>
                <Text className="mt-4 text-sm font-semibold text-[#9FD6E3]">
                  Cast
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-3"
                  contentContainerStyle={{ paddingRight: 24 }}
                >
                  {topCast.map((person) => (
                    <CastCard
                      key={`${person.id}-${person.order}`}
                      name={person.name}
                      role={person.character || "Cast"}
                      image={person.profile_path}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}

            {show.created_by?.length > 0 ? (
              <>
                <Text className="mt-5 text-sm font-semibold text-[#9FD6E3]">
                  Created By
                </Text>
                <Text className="mt-3 text-sm leading-7 text-white/90">
                  {show.created_by.map((creator) => creator.name).join(" • ")}
                </Text>
              </>
            ) : null}

            {topCrew.length > 0 ? (
              <>
                <Text className="mt-5 text-sm font-semibold text-[#9FD6E3]">
                  Crew
                </Text>
                <View className="mt-3 gap-y-3">
                  {topCrew.map((person) => (
                    <View
                      key={`${person.id}-${person.job}`}
                      className="flex-row items-center rounded-[20px] border border-white/10 bg-[#10192A]/60 px-3 py-3"
                    >
                      <Image
                        source={{
                          uri: person.profile_path
                            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                            : "https://placehold.co/120x120/1a2232/ffffff.png",
                        }}
                        className="size-12 rounded-full"
                        resizeMode="cover"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-semibold text-white">
                          {person.name}
                        </Text>
                        <Text className="mt-1 text-xs text-white/70">
                          {person.job}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>

          <View className="mt-7 pb-8">
            <Text className="text-lg font-bold text-white">Networks</Text>
            <Text className="mt-3 text-sm leading-7 text-white/90">
              {show.networks?.map((network) => network.name).join(" • ") ||
                "Network details unavailable."}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showListPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowListPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60"
          activeOpacity={1}
          onPress={() => setShowListPicker(false)}
        />
        <View className="rounded-t-3xl border-t border-white/10 bg-[#0C1420] px-5 pb-12 pt-5">
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">Add to List</Text>
            <TouchableOpacity onPress={() => setShowListPicker(false)}>
              <Text className="text-sm font-semibold text-accentLight">
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {customLists.length === 0 ? (
            <Text className="py-6 text-center text-sm text-white/60">
              No custom lists yet. Create one from the Saved tab.
            </Text>
          ) : (
            <FlatList
              data={customLists}
              keyExtractor={(item) => item.$id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isInList = showCustomListIds.includes(item.$id);
                return (
                  <TouchableOpacity
                    className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-[#1A2740]/90 px-4 py-4"
                    onPress={() => handleToggleCustomList(item)}
                    disabled={listPickerLoading}
                  >
                    <Text className="text-base font-semibold text-white">
                      {item.name}
                    </Text>
                    {isInList ? (
                      <Text className="text-lg text-accentLight">✓</Text>
                    ) : (
                      <View className="size-5 rounded-full border border-white/30" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default TvDetails;
