import { ensureAppwriteSession } from "@/services/appwrite";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "./globals.css";

export default function RootLayout() {
  useEffect(() => {
    ensureAppwriteSession().catch((error) => {
      console.warn("Failed to initialize Appwrite session", error);
    });
  }, []);

  return (
    <>
      <StatusBar hidden={true} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movies/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="tv/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
