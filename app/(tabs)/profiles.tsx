import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

const profileStats = [
  { label: "Saved", value: "12" },
  { label: "Watched", value: "48" },
  { label: "Lists", value: "5" },
];

const quickActions = [
  { title: "Account Details", subtitle: "Update your profile and preferences" },
  { title: "Notifications", subtitle: "Manage reminders and app alerts" },
  { title: "Playback Settings", subtitle: "Control captions and video defaults" },
];

const supportItems = [
  "Privacy & Security",
  "Help Center",
  "About Movie App",
];

const Profiles = () => {
  return (
    <View className="bg-primary flex-1">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 120 }}
      >
        <Image
          source={icons.movie}
          resizeMode="contain"
          style={styles.movieIcon}
        />

        <View className="rounded-[28px] border border-white/10 bg-[#21313B]/95 px-5 py-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-light-200 text-sm">Profile</Text>
              <Text className="text-white text-2xl font-bold mt-2">
                Gina Pham
              </Text>
              <Text className="text-light-200 mt-2 leading-5">
                Building a personal movie library with saved picks, search
                trends, and watchlist ideas.
              </Text>
            </View>

            <View className="size-20 rounded-full bg-accent/20 border border-accent/40 items-center justify-center">
              <Image
                source={icons.profile}
                className="size-10"
                tintColor="#E77023"
              />
            </View>
          </View>

          <View className="flex-row mt-6 rounded-2xl bg-white/5 border border-white/10 py-4">
            {profileStats.map((stat) => (
              <View key={stat.label} className="flex-1 items-center">
                <Text className="text-white text-xl font-bold">
                  {stat.value}
                </Text>
                <Text className="text-light-200 text-xs mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-white text-xl font-bold">Quick Actions</Text>
          <View className="mt-4 gap-y-3">
            {quickActions.map((item) => (
              <View
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-white text-base font-semibold">
                      {item.title}
                    </Text>
                    <Text className="text-light-200 text-sm mt-1 leading-5">
                      {item.subtitle}
                    </Text>
                  </View>
                  <Image
                    source={icons.arrow}
                    className="size-4"
                    tintColor="#88A0B0"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-8 rounded-[28px] border border-white/10 bg-[#18232B]/90 px-5 py-5">
          <Text className="text-white text-xl font-bold">App & Support</Text>
          <View className="mt-4 gap-y-4">
            {supportItems.map((item) => (
              <View
                key={item}
                className="flex-row items-center justify-between border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
              >
                <Text className="text-light-100 text-base">{item}</Text>
                <Image
                  source={icons.arrow}
                  className="size-4"
                  tintColor="#EAFBFF"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profiles;

const styles = StyleSheet.create({
  movieIcon: {
    width: 48,
    height: 40,
    marginTop: 80,
    marginBottom: 20,
    alignSelf: "center",
  },
});
