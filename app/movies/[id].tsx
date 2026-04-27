import FrameLogWordmark from "@/components/FrameLogWordmark";
import { icons } from "@/constants/icon";
import { fetchMovieDetails } from "@/services/api";
import {
  getMovieListStatus,
  markMovieWatched,
  removeSavedMovie,
  saveMovie,
} from "@/services/appwrite";
import { useFetch } from "@/services/useFetch";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const MovieDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string),
  );
  const [saved, setSaved] = useState(false);
  const [watched, setWatched] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [expandedOverview, setExpandedOverview] = useState(false);

  useEffect(() => {
    const loadMovieState = async () => {
      if (!movie?.id) return;

      try {
        const status = await getMovieListStatus(movie.id);
        setSaved(status.saved);
        setWatched(status.watched);
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

  const handleDefaultSavePress = async () => {
    if (!movie || saveLoading) return;

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

  const handleMarkWatched = async () => {
    if (!movie || watchLoading) return;

    try {
      setWatchLoading(true);
      await markMovieWatched(movie);
      setWatched(true);
    } catch {
      Alert.alert(
        "Watch update failed",
        "The movie could not be marked as watched.",
      );
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

          <LinearGradient
            colors={[
              "rgba(8,11,20,0.00)",
              "rgba(8,11,20,0.04)",
              "rgba(8,11,20,0.14)",
              "rgba(10,14,22,0.32)",
              "rgba(10,14,22,0.58)",
            ]}
            locations={[0, 0.18, 0.38, 0.62, 1]}
            className="absolute inset-0"
          />

          <View className="absolute bottom-0 left-0 right-0 h-[430px]">
            <LinearGradient
              colors={[
                "rgba(12,20,32,0)",
                "rgba(12,20,32,0.65)",
                "#0C1420",
                "#0C1420",
              ]}
              locations={[0, 0.18, 0.48, 1]}
              className="h-full w-full"
            />
          </View>

          <LinearGradient
            colors={[
              "rgba(12,20,32,0)",
              "rgba(12,20,32,0.74)",
              "#0C1420",
              "#0C1420",
            ]}
            locations={[0, 0.12, 0.34, 1]}
            className="absolute bottom-0 left-0 right-0 h-[360px]"
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

            <View className="-mx-5 bg-[#0C1420]/60 px-5 pb-8 pt-4">
              {movie.tagline ? (
                <Text
                  className="text-sm italic text-[#D7F2F8]"
                  numberOfLines={2}
                  style={{
                    textShadowColor: "rgba(0,0,0,0.55)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 6,
                  }}
                >
                  {movie.tagline}
                </Text>
              ) : null}

              <View className="mt-3 flex-row flex-wrap gap-2">
                {metadataPill(`${Math.round(movie.vote_average)}/10`)}
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
                    label={
                      watchLoading
                        ? "Updating..."
                        : watched
                          ? "Watched"
                          : "Watched"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View className=" bg-[#0C1420] px-5 pt-8">
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
    </View>
  );
};

export default MovieDetails;
