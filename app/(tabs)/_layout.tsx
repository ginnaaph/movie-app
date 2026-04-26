import { icons } from "@/constants/icon";
import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";

function TabsIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <View className="h-full flex w-full items-center justify-center">
        <Image
          source={icon}
          tintColor="#EAFBFF"
          resizeMode="contain"
          style={{ width: 25, height: 25 }}
        />

        <Text className="text-accent font-medium text-xs">{title}</Text>
      </View>
    );
  }
  return (
    <View className="h-full w-full items-center justify-center">
      <Image
        source={icon}
        tintColor={focused ? "#5F9EA0" : "#EAFBFF"}
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
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarStyle: {
          backgroundColor: "#263743",
          borderColor: "#88A0B0",
          borderRadius: 40,
          marginHorizontal: 20,
          marginBottom: 36,
          height: 52,
          position: "absolute",
          overflow: "hidden",
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
        },
        tabBarIconStyle: {
          width: 40,
          height: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Log",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon focused={focused} icon={icons.profile} title="Log" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Discover",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon focused={focused} icon={icons.search} title="Discover" />
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
          href: null,
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
