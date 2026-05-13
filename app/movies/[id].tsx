import FrameLogWordmark from "@/components/FrameLogWordmark";
import { icons } from "@/constants/icon";
import { fetchMovieDetails } from "@/services/api";
import {
    addMovieToList,
    createList,
    getLists,
    getMovieListStatus,
    markMovieWatched,
    removeMovieFromList,
    removeSavedMovie,
    saveMovie,
} from "@/services/appwrite";
import {
    getListDestinationLabel,
    isSavedList,
    planSingleListDestination,
} from "@/services/listSelection";
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
    TextInput,
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
  Music: "#FB7185",
  Mystery: "#60A5FA",
  Romance: "#F472B6",
  "Science Fiction": "#22D3EE",
  Thriller: "#F59E0B",
  War: "#94A3B8",
};

const metadataPill = (label: string) => (
  <View key={label} className="rounded-full  bg-primary/70 px-3 py-2">
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

const MovieDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string),
  );
  const [saved, setSaved] = useState(false);
  const [watched, setWatched] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [expandedOverview, setExpandedOverview] = useState(false);
  const [customLists, setCustomLists] = useState<MovieList[]>([]);
  const [movieCustomListIds, setMovieCustomListIds] = useState<string[]>([]);
  const [showListPicker, setShowListPicker] = useState(false);
  const [listPickerLoading, setListPickerLoading] = useState(false);
  const [showOtherLists, setShowOtherLists] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [listPickerMessage, setListPickerMessage] = useState("");

  useEffect(() => {
    const loadMovieState = async () => {
      if (!movie?.id) return;

      try {
        const [status, allLists] = await Promise.all([
          getMovieListStatus(movie.id),
          getLists(),
        ]);
        setSaved(status.saved);
        setWatched(status.watched);
        setMovieCustomListIds(status.customListIds);
        setCustomLists(
          allLists.filter(
            (list) => list.slug === "saved-list" || list.type === "custom",
          ),
        );
      } catch {}
    };

    loadMovieState();
  }, [movie?.id]);

  const topCast = useMemo(
    () => movie?.credits?.cast?.slice(0, 6) ?? [],
    [movie?.credits?.cast],
  );
  const topCrew = useMemo(() => {
    const crew = movie?.credits?.crew ?? [];
    const preferredJobs = ["Director", "Writer", "Screenplay", "Producer"];
    const selected = preferredJobs
      .map((job) => crew.find((person) => person.job === job))
      .filter(Boolean);

    return selected.slice(0, 4) as NonNullable<MovieDetails["credits"]>["crew"];
  }, [movie?.credits?.crew]);

  const metadata = [
    movie?.release_date?.split("-")[0],
    movie?.runtime ? `${movie.runtime}m` : null,
    movie?.status || null,
    movie?.spoken_languages?.[0]?.english_name ?? null,
  ].filter(Boolean) as string[];
  const savedList = customLists.find(isSavedList);
  const otherLists = customLists.filter((list) => !isSavedList(list));
  const currentListLabel = getListDestinationLabel({
    currentSaved: saved,
    currentCustomListIds: movieCustomListIds,
    lists: customLists,
  });

  const applyListDestination = async (destinationList: MovieList) => {
    if (!movie || listPickerLoading || !savedList) return;

    const plan = planSingleListDestination({
      destinationList,
      savedList,
      currentSaved: saved,
      currentCustomListIds: movieCustomListIds,
    });

    if (plan.alreadyInDestination) {
      setListPickerMessage(`Already in ${destinationList.name}.`);
      return;
    }

    try {
      setListPickerMessage("");
      setListPickerLoading(true);

      await Promise.all([
        ...plan.customListIdsToRemove.map((listId) =>
          removeMovieFromList(listId, movie.id),
        ),
        ...(plan.shouldRemoveSaved ? [removeSavedMovie(movie.id)] : []),
      ]);

      if (plan.shouldAddSaved) {
        await saveMovie(movie);
      }

      await Promise.all(
        plan.customListIdsToAdd.map((listId) => addMovieToList(listId, movie)),
      );

      if (isSavedList(destinationList)) {
        setSaved(true);
        setMovieCustomListIds([]);
      } else {
        setSaved(false);
        setMovieCustomListIds([destinationList.$id]);
      }

      setListPickerMessage(`Moved to ${destinationList.name}.`);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The list could not be updated right now.",
      );
      console.error("moveMovieListDestination failed", error);
      Alert.alert("List update failed", message);
    } finally {
      setListPickerLoading(false);
    }
  };

  const handleCreateAndSelectList = async () => {
    if (!newListName.trim() || creatingList || listPickerLoading) return;

    try {
      setCreatingList(true);
      const createdList = await createList(newListName);
      setCustomLists((current) => [...current, createdList]);
      setNewListName("");
      setShowOtherLists(true);
      await applyListDestination(createdList);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The list could not be created right now.",
      );
      console.error("createMovieListDestination failed", error);
      Alert.alert("Create list failed", message);
    } finally {
      setCreatingList(false);
    }
  };

  const handleMarkWatched = async () => {
    if (!movie || watchLoading) return;

    try {
      setWatchLoading(true);
      await markMovieWatched(movie);
      setWatched(true);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The movie could not be marked as watched.",
      );
      console.error("markMovieWatched failed", error);
      Alert.alert("Watch update failed", message);
    } finally {
      setWatchLoading(false);
    }
  };

  if (loading || !movie) {
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
                movie.backdrop_path || movie.poster_path
              }`,
            }}
            className="h-full w-full"
            resizeMode="cover"
          />

          {/* Top vignette — keeps nav bar readable against bright backdrops */}
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "transparent"]}
            className="absolute left-0 right-0 top-0 h-52"
          />

          {/* Cinematic bottom fade — single smooth sweep to background */}
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
                onPress={() => setShowListPicker(true)}
              >
                <Image
                  source={icons.saved}
                  className="size-6"
                  tintColor={saved ? "#3AB0FF" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View className="absolute bottom-0 left-0 right-0 px-5  pt-24">
            <Text
              className="max-w-[88%] text-4xl font-bold leading-tight text-white"
              style={{
                textShadowColor: "rgba(0,0,0,0.95)",
                textShadowOffset: { width: 0, height: 5 },
                textShadowRadius: 22,
              }}
            >
              {movie.title}
            </Text>

            <View className="-mx-5 px-5 pb-8 pt-4">
              {movie.tagline ? (
                <Text
                  className="text-sm italic text-[#D7F2F8]"
                  numberOfLines={2}
                  style={{
                    textShadowColor: "rgba(0,0,0,0.7)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 8,
                  }}
                >
                  {movie.tagline}
                </Text>
              ) : null}

              <View className="mt-3 flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center rounded-full bg-amber-500/20 px-3 py-2">
                  <Text className="mr-1 text-sm text-amber-400">★</Text>
                  <Text className="text-sm font-bold text-amber-300">
                    {movie.vote_average.toFixed(1)}
                  </Text>
                  <Text className="ml-0.5 text-xs text-white/50">/10</Text>
                </View>
                {metadata.map((item) => metadataPill(item))}
              </View>

              <View className="mt-4 flex-row flex-wrap gap-2">
                {movie.genres?.slice(0, 5).map((genre) => (
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
                    saved || movieCustomListIds.length > 0
                      ? "bg-accentLight"
                      : "bg-[#1A2740]/90"
                  }`}
                  onPress={() => setShowListPicker(true)}
                >
                  <ActionIconLabel
                    icon="+"
                    label={
                      listPickerLoading ? "Updating..." : currentListLabel
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
              </View>
            </View>
          </View>
        </View>

        <View className="bg-[#0C1420] px-5 pt-8">
          <Text
            className="text-base leading-8 text-white"
            numberOfLines={expandedOverview ? undefined : 4}
          >
            {movie.overview || "No overview is available for this title yet."}
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
            ) : (
              <Text className="mt-4 text-sm text-white/75">
                Cast and crew details are unavailable for this title.
              </Text>
            )}
          </View>

          <View className="mt-7 pb-8">
            <Text className="text-lg font-bold text-white">Production</Text>
            <Text className="mt-3 text-sm leading-7 text-white/90">
              {movie.production_companies
                ?.map((company) => company.name)
                .join(" • ") || "Production details unavailable."}
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
            <Text className="text-lg font-bold text-white">Save to List</Text>
            <TouchableOpacity onPress={() => setShowListPicker(false)}>
              <Text className="text-sm font-semibold text-accentLight">
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {listPickerMessage ? (
            <Text className="mb-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-accentLight">
              {listPickerMessage}
            </Text>
          ) : null}

          {savedList ? (
            <TouchableOpacity
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-[#1A2740]/90 px-4 py-4"
              onPress={() => applyListDestination(savedList)}
              disabled={listPickerLoading || creatingList}
            >
              <View>
                <Text className="text-base font-semibold text-white">Saved</Text>
                {saved && movieCustomListIds.length === 0 ? (
                  <Text className="mt-1 text-xs text-accentLight">
                    Already in this list
                  </Text>
                ) : null}
              </View>
              {saved && movieCustomListIds.length === 0 ? (
                <Text className="text-lg text-accentLight">✓</Text>
              ) : (
                <View className="size-5 rounded-full border border-white/30" />
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-[#10192A] px-4 py-4"
            onPress={() => setShowOtherLists((current) => !current)}
          >
            <Text className="text-base font-semibold text-white">
              Other lists
            </Text>
            <Text className="text-lg font-semibold text-accentLight">
              {showOtherLists ? "⌃" : "⌄"}
            </Text>
          </TouchableOpacity>

          {showOtherLists ? (
            <View>
              <View className="mb-3 flex-row gap-x-2">
                <TextInput
                  value={newListName}
                  onChangeText={setNewListName}
                  placeholder="New list name"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  className="flex-1 rounded-2xl border border-white/10 bg-[#1A2740]/90 px-4 py-3 text-white"
                />
                <TouchableOpacity
                  className="items-center justify-center rounded-2xl bg-accentLight px-4"
                  onPress={handleCreateAndSelectList}
                  disabled={
                    !newListName.trim() || creatingList || listPickerLoading
                  }
                >
                  <Text className="font-semibold text-white">
                    {creatingList ? "..." : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>

              {otherLists.length === 0 ? (
                <Text className="py-3 text-center text-sm text-white/60">
                  No other lists yet.
                </Text>
              ) : (
                <FlatList
                  data={otherLists}
                  keyExtractor={(item) => item.$id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const isInList = movieCustomListIds.includes(item.$id);
                    return (
                      <TouchableOpacity
                        className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-[#1A2740]/90 px-4 py-4"
                        onPress={() => applyListDestination(item)}
                        disabled={listPickerLoading || creatingList}
                      >
                        <View>
                          <Text className="text-base font-semibold text-white">
                            {item.name}
                          </Text>
                          {isInList ? (
                            <Text className="mt-1 text-xs text-accentLight">
                              Already in this list
                            </Text>
                          ) : null}
                        </View>
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
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

export default MovieDetails;
