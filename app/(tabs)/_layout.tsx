import { icons } from "@/constants/icon";
import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";

function TabsIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <View className="h-full w-full items-center justify-center">
        <Image
          source={icon}
          tintColor="#151312"
          resizeMode="contain"
          style={{ width: 20, height: 20 }}
        />

        <Text className="text-secondary font-semibold text-xs">{title}</Text>
      </View>
    );
  }
  return (
    <View className="h-full w-full items-center justify-center">
      <Image
        source={icon}
        tintColor={focused ? "#151312" : "#A8B5DB"}
        resizeMode="contain"
        style={{ width: 20, height: 20 }}
      />
    </View>
  );
}

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarStyle: {
          borderRadius: 30,
          marginHorizontal: 20,
          marginBottom: 36,
          height: 56,
          position: "relative",
          overflow: "hidden",
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
        },
        tabBarIconStyle: {
          width: 20,
          height: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon focused={focused} icon={icons.search} title="Search" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon focused={focused} icon={icons.saved} title="Saved" />
          ),
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: "Profiles",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon focused={focused} icon={icons.profile} title="Profiles" />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
