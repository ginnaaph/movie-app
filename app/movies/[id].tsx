import SaveButton from "@/components/SaveButton";
import { icons } from "@/constants/icon";
import { fetchMovieDetails } from "@/services/api";
import {
  addMovieToList,
  getLists,
  getMovieListStatus,
  markMovieWatched,
  removeMovieFromList,
  removeSavedMovie,
  saveMovie,
} from "@/services/appwrite";
import { useFetch } from "@/services/useFetch";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MovieInfoProps {
  label: string;
  value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
  <View className="flex-col items-start justify-center mt-5">
    <Text className="text-accent font-semibold text-lg">{label}</Text>
    <Text className="text-text font-normal text-sm mt-2">{value || "N/A"}</Text>
  </View>
);

const MovieDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string),
  );
  const [lists, setLists] = useState<MovieList[]>([]);
  const [saved, setSaved] = useState(false);
  const [customListIds, setCustomListIds] = useState<string[]>([]);
  const [watched, setWatched] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  useEffect(() => {
    const loadMovieState = async () => {
      if (!movie?.id) {
        return;
      }

      try {
        const [availableLists, status] = await Promise.all([
          getLists(),
          getMovieListStatus(movie.id),
        ]);

        setLists(availableLists);
        setSaved(status.saved);
        setCustomListIds(status.customListIds);
        setWatched(status.watched);
      } catch {}
    };

    loadMovieState();
  }, [movie?.id]);

  const customLists = lists.filter((list) => list.type === "custom");

  const handleDefaultSavePress = async () => {
    if (!movie || saveLoading) {
      return;
    }

    try {
      setSaveLoading(true);

      if (saved) {
        await removeSavedMovie(movie.id);
        setSaved(false);
      } else {
        await saveMovie(movie);
        setSaved(true);
      }
    } catch {
      Alert.alert("Save failed", "The movie could not be updated right now.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCustomListPress = async (listId: string) => {
    if (!movie || saveLoading) {
      return;
    }

    try {
      setSaveLoading(true);

      if (customListIds.includes(listId)) {
        await removeMovieFromList(listId, movie.id);
        setCustomListIds((current) => current.filter((id) => id !== listId));
      } else {
        await addMovieToList(listId, movie);
        setCustomListIds((current) => [...current, listId]);
      }
    } catch {
      Alert.alert("Save failed", "The list could not be updated right now.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMarkWatched = async () => {
    if (!movie || watchLoading) {
      return;
    }

    try {
      setWatchLoading(true);
      await markMovieWatched(movie);
      setWatched(true);
    } catch {
      Alert.alert("Watch update failed", "The movie could not be marked as watched.");
    } finally {
      setWatchLoading(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView className="bg-primary/80 flex-1">
        <ActivityIndicator />
      </SafeAreaView>
    );

  return (
    <View className=" bg-primary flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
            }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />
          <TouchableOpacity className="absolute bottom-5 right-5 rounded-full size-14 bg-text/80 flex items-center justify-center">
            <Image
              source={icons.play}
              className="w-6 h-7 ml-1"
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>
        <LinearGradient
          colors={["transparent", "transparent", "#20265C"]}
          locations={[0, 0.3, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 2 }}
          className=" px-5 pt-32"
        >
          <View className="w-full flex-row items-center justify-between gap-x-4 ml-2">
            <Text className="text-text font-bold text-4xl flex-1 pt-5">
              {movie?.title}
            </Text>
            <SaveButton onPress={handleDefaultSavePress} isSaved={saved} />
          </View>
          <View className="flex-row items-center gap-x-1 mt-2 ml-4">
            <Text className="text-accentLight text-md">
              {movie?.release_date?.split("-")[0]} •
            </Text>
            <Text className="text-accentLight text-md">{movie?.runtime}m</Text>
          </View>
          <Text className="text-accent text-md mt-3 ml-4 italic">
            {saveLoading
              ? "Updating your saved movie..."
              : saved
                ? "Saved to your default saved list"
                : "Tap save to add this to your default saved list"}
          </Text>

          <View className="mt-5 ml-4 gap-y-3">
            <Text className="text-text text-lg font-semibold">Actions</Text>
            <TouchableOpacity
              className={`rounded-2xl px-4 py-3 ${
                watched ? "bg-secondary/30" : "bg-accentLight"
              }`}
              onPress={handleMarkWatched}
              disabled={watched || watchLoading}
            >
              <Text className="text-white text-center font-semibold">
                {watchLoading
                  ? "Marking watched..."
                  : watched
                    ? "Already in Watched List"
                    : "Mark Watched"}
              </Text>
            </TouchableOpacity>

            <View className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <Text className="text-white text-base font-semibold">
                Save To List
              </Text>
              {customLists.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {customLists.map((list) => {
                    const active = customListIds.includes(list.$id);

                    return (
                      <TouchableOpacity
                        key={list.$id}
                        className={`rounded-full border px-4 py-2 ${
                          active
                            ? "border-accentLight bg-accentLight/20"
                            : "border-white/10 bg-primary/40"
                        }`}
                        onPress={() => handleCustomListPress(list.$id)}
                        disabled={saveLoading}
                      >
                        <Text className="text-white font-medium">{list.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-accent mt-3 leading-5">
                  Create a custom list from the Saved tab to organize this movie.
                </Text>
              )}
            </View>
          </View>

          <View className="flex-row items-center bg-slateGrey w-1/3 px-2 py-1 rounded-md gap-x-1 mt-2 ml-4">
            <Image source={icons.star} className="size-4" />

            <Text className="text-text font-bold text-sm">
              {Math.round(movie?.vote_average ?? 0)}/10
            </Text>

            <Text className=" text-primary">({movie?.vote_count} votes)</Text>
          </View>
          <View className="flex-row items-center gap-x-2 mt-4 ml-4">
            <MovieInfo label="Overview" value={movie?.overview} />
            <MovieInfo
              label="Genres"
              value={movie?.genres?.map((g) => g.name).join(" • ") || "N/A"}
            />
          </View>

          <View className="flex flex-row justify-between w-1/2 ml-4">
            <MovieInfo
              label="Budget"
              value={`$${(movie?.budget ?? 0) / 1_000_000} million`}
            />
            <MovieInfo
              label="Revenue"
              value={`$${Math.round(
                (movie?.revenue ?? 0) / 1_000_000,
              )} million`}
            />
          </View>
          <View className="flex-row items-center gap-x-2 mt-4 ml-4 pb-40">
            <MovieInfo
              label="Production Companies"
              value={
                movie?.production_companies?.map((c) => c.name).join(" • ") ||
                "N/A"
              }
            />
          </View>
        </LinearGradient>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-5 left-0 right-0 mx-5 bg-accentLight rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
        onPress={router.back}
      >
        <Image
          source={icons.arrow}
          className="size-5 mr-1 mt-0.5"
          tintColor="#fff"
        />
        <Text className="text-white font-semibold text-base">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MovieDetails;
