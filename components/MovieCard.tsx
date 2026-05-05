import { icons } from "@/constants/icon";
import { Href, Link } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export const MovieCard = ({
  id,
  poster_path,
  media_type = "movie",
  vote_average,
  ...item
}: Movie | TVShow) => {
  const title = "title" in item ? item.title : item.name;
  const releaseDate = "release_date" in item ? item.release_date : item.first_air_date;
  const href = {
    pathname: media_type === "tv" ? "/tv/[id]" : "/movies/[id]",
    params: { id: id.toString() },
  } as Href;

  return (
    <Link href={href} asChild>
      <TouchableOpacity className="w-[30%]">
        <Image
          source={{
            uri: poster_path
              ? `https://image.tmdb.org/t/p/w500${poster_path}`
              : "https://placehold.co/600x400/1a1a1a.png",
          }}
          className="h-52 w-full rounded-lg"
          resizeMode="cover"
        />
        <Text className="text-xs font-bold text-white mt-2">{title}</Text>
        <View className="flex-row items-center justify-start gap-x-1">
          <Image source={icons.star} className="h-3 w-3" />
          <Text className="text-white text-xs">
            {" "}
            {Math.round(vote_average / 2)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-400 font-medium mt-1">
            {releaseDate?.split("-")[0]}
          </Text>
          <Text className="text-xs text-gray-400 font-medium mt-1">
            {media_type === "tv" ? "TV" : "Movie"}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
