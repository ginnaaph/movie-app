import SavedCard from "@/components/SavedMovieCard";
import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import { getSavedMovies } from "@/services/appwrite";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Saved = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [movies, setMovies] = useState<SavedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        setMovies((await getSavedMovies()) ?? []);
      } catch (loadError) {
        console.error("Error loading saved movies:", loadError);
        setError("Failed to load saved movies");
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      loadSavedMovies();
    }
  }, [isFocused]);

  return (
    <View className="bg-primary flex-1">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 24 }}
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
          <Text className="text-white mt-10">Error: {error}</Text>
        ) : (
          <View className="flex-1 mt-5">
            <SearchBar
              onPress={() => router.push("/search")}
              placeholder="Find more movies to save..."
            />

            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl text-white font-bold">
                  Saved Movies
                </Text>
                <View className="flex-row items-center gap-x-2">
                  <Image
                    source={icons.saved}
                    className="size-4"
                    tintColor="#E77023"
                  />
                  <Text className="text-accentLight text-sm font-medium">
                    {movies.length} saved
                  </Text>
                </View>
              </View>

              {movies.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-4"
                  data={movies}
                  contentContainerStyle={{
                    gap: 16,
                    paddingRight: 20,
                  }}
                  renderItem={({ item, index }) => (
                    <SavedCard movie={item} index={index} />
                  )}
                  keyExtractor={(item) => item.$id}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                />
              ) : (
                <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
                  <Text className="text-white text-lg font-semibold">
                    No saved movies yet
                  </Text>
                  <Text className="text-light-200 mt-2 leading-5">
                    Save a movie from the details page and it will show up here.
                  </Text>
                </View>
              )}
            </View>

            {movies.length > 0 ? (
              <View className="mt-8 rounded-2xl border border-white/10 bg-slateGrey px-5 py-5">
                <Text className="text-secondary text-lg font-bold">
                  Your Library
                </Text>
                <Text className="text-white mt-2 leading-5">
                  Revisit movies you bookmarked and jump back into their details
                  anytime.
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Saved;

const styles = StyleSheet.create({
  movieIcon: {
    width: 48,
    height: 40,
    marginTop: 80,
    marginBottom: 20,
    alignSelf: "center",
  },
});
