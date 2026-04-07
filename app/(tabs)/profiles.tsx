import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const Profiles = () => {
  return (
    <View className="bg-primary flex-1 px-10">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <View className="flex justify-center items-center flex-1 flex-col gap-5">
        <Image source={icons.profile} className="size-10" tintColor="#fff" />

        <Text className="text-white"> Profiles</Text>
      </View>
    </View>
  );
};

export default Profiles;

const styles = StyleSheet.create({});
