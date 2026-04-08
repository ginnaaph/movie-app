import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import { getSavedMovies } from "@/services/appwrite";
import { useIsFocused } from "@react-navigation/native";
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
    <View className="bg-primary flex-1 px-10">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0, minHeight: "100%" }}
      >
        <Image
          source={icons.movie}
          resizeMode="contain"
          style={styles.movieIcon}
        />
        <View className="mt-2">
          <Text className="text-accent text-3xl font-medium">
            {" "}
            Saved Movies
          </Text>
        </View>
        <View className="flex flex-row items-center mt-5 flex-1 gap-x-4">
          <Image source={icons.saved} className="size-6" tintColor="#fff" />

          <Text className="text-white text-center text-lg font-semibold">
            {loading
              ? "Loading..."
              : error
                ? `Error: ${error}`
                : movies?.length
                  ? `${movies.length} movies saved`
                  : "No movies saved"}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#E77023" className="mt-10" />
        ) : null}
        <FlatList
          data={movies}
          renderItem={({ item, index }) => (
            <SavedMovieCard movie={item} index={index} />
          )}
          keyExtractor={(item) => item.$id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "flex-start",
            gap: 8,
            paddingRight: 12,
          }}
          className="mt-4 pb-32"
          scrollEnabled={false}
        />
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
