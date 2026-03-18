import { icons } from "@/constants/icon";
import { Link } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export const MovieCard = ({
  id,
  poster_path,
  title,
  vote_average,
  release_date,
}: Movie) => {
  return (
    <Link href={`/movies/${id}`} asChild>
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
            {release_date?.split("-")[0]}
          </Text>
          <Text className="text-xs text-gray-400 font-medium mt-1">Movie</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
