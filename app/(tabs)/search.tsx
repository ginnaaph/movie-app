import { MovieCard } from "@/components/MovieCard";
import FrameLogWordmark from "@/components/FrameLogWordmark";
import SearchBar from "@/components/SearchBar";
import TrendingCard from "@/components/TrendingCard";
import { images } from "@/constants/images";
import { fetchMovies } from "@/services/api";
import { getTrendingMovies, updateSeachCount } from "@/services/appwrite";
import { useFetch } from "@/services/useFetch";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const {
    data: trendingMovies,
    loading: trendingLoading,
    error: trendingError,
  } = useFetch(getTrendingMovies);

  const {
    data: latestMovies,
    loading: latestLoading,
    error: latestError,
  } = useFetch(() => fetchMovies({ query: "" }));

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }

      try {
        setSearchLoading(true);
        setSearchError(null);

        const results = await fetchMovies({ query: searchQuery });
        setSearchResults(results);

        if (results.length > 0 && results[0]) {
          await updateSeachCount(searchQuery, results[0]);
        }
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : "Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const discoveryLoading = trendingLoading || latestLoading;
  const discoveryError = trendingError || latestError;
  const gridData = isSearching ? searchResults : (latestMovies ?? []);

  return (
    <View className="bg-primary flex-1">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <FlatList
        data={gridData}
        renderItem={({ item }) => <MovieCard {...item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 16,
          paddingRight: 5,
          marginVertical: 10,
        }}
        className="px-5"
        ListHeaderComponent={
          <>
            <View className="mt-20 w-full flex-row items-center justify-center">
              <FrameLogWordmark scale={1.6} />
            </View>
            <View className="my-5">
              <SearchBar
                placeholder="Search for movies now, TV shows next..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {isSearching ? (
              <>
                {searchLoading ? (
                  <ActivityIndicator
                    size="large"
                    color="#0000ff"
                    className="my-3"
                  />
                ) : null}
                {searchError ? (
                  <Text className="text-center text-red-500">
                    Error: {searchError}
                  </Text>
                ) : null}
                {!searchLoading && !searchError ? (
                  <Text className="mb-3 text-xl font-bold text-white">
                    Results for <Text className="text-accent">{searchQuery}</Text>
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                {discoveryLoading ? (
                  <ActivityIndicator
                    size="large"
                    color="#0000ff"
                    className="mt-10 self-center"
                  />
                ) : discoveryError ? (
                  <Text className="text-white">Error: {discoveryError}</Text>
                ) : (
                  <>
                    {trendingMovies && trendingMovies.length > 0 ? (
                      <View className="mb-5">
                        <Text className="mb-3 mt-1 text-xl font-bold text-white">
                          Trending Movies
                        </Text>
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          data={trendingMovies}
                          contentContainerStyle={{ gap: 16 }}
                          renderItem={({ item, index }) => (
                            <TrendingCard movie={item} index={index} />
                          )}
                          keyExtractor={(item) => item.movie_id.toString()}
                          ItemSeparatorComponent={() => <View className="w-4" />}
                          scrollEnabled={false}
                        />
                      </View>
                    ) : null}

                    <Text className="mb-2 text-xl font-semibold text-white">
                      Latest Movies
                    </Text>
                    <Text className="mb-2 text-accent">
                      Search when you know what you want, or browse what is popular right now.
                    </Text>
                  </>
                )}
              </>
            )}
          </>
        }
        ListEmptyComponent={
          isSearching && !searchLoading && !searchError ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray-500">
                No movies found for that search yet.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
};

export default Search;
