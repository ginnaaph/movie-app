import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const Saved = () => {
  return (
    <View className="bg-primary flex-1 px-10">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <View className="flex justify-center items-center flex-1 flex-col gap-5">
        <Image source={icons.saved} className="size-10" tintColor="#fff" />

        <Text className="text-white"> Saved</Text>
      </View>
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
