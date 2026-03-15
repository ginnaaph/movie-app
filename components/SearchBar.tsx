import { icons } from "@/constants/icon";
import React from "react";
import { Image, TextInput, View } from "react-native";

const SearchBar = () => {
  return (
    <View className="flex-row items-center bg-white rounded-full px-5 py-5">
      <Image
        source={icons.search}
        className="size-5"
        resizeMode="contain"
        tintColor="#88A0B0"
      />
      <TextInput
        onPress={() => {}}
        placeholder="Search for movies, TV shows, actors..."
        className="flex-1 ml-3  text-font-regular text-font"
        placeholderTextColor="#88A0B0"
      />
    </View>
  );
};

export default SearchBar;
