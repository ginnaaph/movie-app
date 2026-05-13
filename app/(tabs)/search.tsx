import { MovieCard } from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import TrendingCard from "@/components/TrendingCard";
import { images } from "@/constants/images";
import { fetchMovies, fetchTvShows } from "@/services/api";
import { getTrendingMedia, updateSearchCount } from "@/services/appwrite";
import { useFetch } from "@/services/useFetch";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [searchResults, setSearchResults] = useState<(Movie | TVShow)[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const {
    data: trendingMovies,
    loading: trendingLoading,
    error: trendingError,
  } = useFetch(() => getTrendingMedia(mediaType), true, mediaType);

  const {
    data: latestMovies,
    loading: latestLoading,
    error: latestError,
  } = useFetch(
    () => (mediaType === "tv" ? fetchTvShows({ query: "" }) : fetchMovies({ query: "" })),
    true,
    mediaType,
  );

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

        const results =
          mediaType === "tv"
            ? await fetchTvShows({ query: searchQuery })
            : await fetchMovies({ query: searchQuery });
        setSearchResults(results);

        if (results.length > 0 && results[0]) {
          await updateSearchCount(searchQuery, results[0], mediaType);
        }
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : "Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [mediaType, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const discoveryLoading = trendingLoading || latestLoading;
  const discoveryError = trendingError || latestError;
  const gridData = isSearching ? searchResults : (latestMovies ?? []);
  const mediaLabel = mediaType === "tv" ? "TV shows" : "movies";

  return (
    <View className="bg-primary flex-1">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <FlatList
        data={gridData}
        renderItem={({ item }) => <MovieCard {...item} />}
        keyExtractor={(item) => `${mediaType}-${item.id}`}
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
              <Image
                source={images.framelogIcon}
                className="size-16"
                resizeMode="contain"
              />
            </View>
            <View className="my-5">
              <View className="mb-4 flex-row rounded-full border border-white/10 bg-[#111A28]/80 p-1">
                {(["movie", "tv"] as MediaType[]).map((type) => {
                  const selected = mediaType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      className={`flex-1 rounded-full px-4 py-3 ${
                        selected ? "bg-accentLight" : "bg-transparent"
                      }`}
                      onPress={() => {
                        setMediaType(type);
                        setSearchResults([]);
                        setSearchError(null);
                      }}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          selected ? "text-white" : "text-white/70"
                        }`}
                      >
                        {type === "tv" ? "TV Shows" : "Movies"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <SearchBar
                placeholder={`Search for ${mediaLabel}...`}
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
                          Trending {mediaType === "tv" ? "TV Shows" : "Movies"}
                        </Text>
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          data={trendingMovies}
                          contentContainerStyle={{ gap: 16 }}
                          renderItem={({ item, index }) => (
                            <TrendingCard movie={item} index={index} />
                          )}
                          keyExtractor={(item) =>
                            `${item.media_type ?? mediaType}-${item.media_id ?? item.movie_id}`
                          }
                          ItemSeparatorComponent={() => <View className="w-4" />}
                          scrollEnabled={false}
                        />
                      </View>
                    ) : null}

                    <Text className="mb-2 text-xl font-semibold text-white">
                      {mediaType === "tv" ? "Latest TV Shows" : "Latest Movies"}
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
                No {mediaLabel} found for that search yet.
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
