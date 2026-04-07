import { icons } from "@/constants/icon";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const Profiles = () => {
  return (
    <View className="bg-primary flex-1 px-10">
      <View className="flex justify-center items-center flex-1 flex-col gap-5">
        <Image source={icons.profile} className="size-10" tintColor="#000" />

        <Text className="text-slate-700"> profiles</Text>
      </View>
    </View>
  );
};

export default Profiles;

const styles = StyleSheet.create({});
