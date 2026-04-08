import SaveButton from "@/components/SaveButton";
import { icons } from "@/constants/icon";
import { fetchMovieDetails } from "@/services/api";
import {
  getSavedMovie,
  removeSavedMovie,
  saveMovie,
} from "@/services/appwrite";
import { useFetch } from "@/services/useFetch";
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
    <Text className="text-light-200 font-semibold text-md">{label}</Text>
    <Text className="text-light-100 font-normal text-sm mt-2">
      {value || "N/A"}
    </Text>
  </View>
);

const MovieDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string),
  );
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const loadSavedState = async () => {
      if (!movie?.id) {
        return;
      }

      try {
        setSaved(Boolean(await getSavedMovie(movie.id)));
      } catch (error) {
        console.error("Error loading saved state:", error);
      }
    };

    loadSavedState();
  }, [movie?.id]);

  const handleSavePress = async () => {
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
    } catch (error) {
      console.error("Error updating saved movie:", error);
      Alert.alert("Save failed", "The movie could not be updated right now.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView className="bg-primary/80 flex-1">
        <ActivityIndicator />
      </SafeAreaView>
    );

  return (
    <View className=" bg-[#F2F4F7] flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
            }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />
          <TouchableOpacity className="absolute bottom-5 right-5 rounded-full size-14 bg-white flex items-center justify-center">
            <Image
              source={icons.play}
              className="w-6 h-7 ml-1"
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>
        <View className="flex-col items-start justify-center mt-5 px-5">
          <View className="w-full flex-row items-start justify-between gap-x-4">
            <Text className="text-primary font-bold text-xl flex-1">
              {movie?.title}
            </Text>
            <SaveButton onPress={handleSavePress} isSaved={saved} />
          </View>
          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-accent text-sm">
              {movie?.release_date?.split("-")[0]} •
            </Text>
            <Text className="text-accent text-sm">{movie?.runtime}m</Text>
          </View>
          <Text className="text-accent text-sm mt-3">
            {saveLoading
              ? "Updating saved movies..."
              : saved
                ? "Saved to your list"
                : "Tap the bookmark to save this movie"}
          </Text>

          <View className="flex-row items-center bg-secondary/20 px-2 py-1 rounded-md gap-x-1 mt-2">
            <Image source={icons.star} className="size-4" />

            <Text className="text-white font-bold text-sm">
              {Math.round(movie?.vote_average ?? 0)}/10
            </Text>

            <Text className="text-accent text-sm">
              ({movie?.vote_count} votes)
            </Text>
          </View>

          <MovieInfo label="Overview" value={movie?.overview} />
          <MovieInfo
            label="Genres"
            value={movie?.genres?.map((g) => g.name).join(" • ") || "N/A"}
          />

          <View className="flex flex-row justify-between w-1/2">
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

          <MovieInfo
            label="Production Companies"
            value={
              movie?.production_companies?.map((c) => c.name).join(" • ") ||
              "N/A"
            }
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-5 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
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
