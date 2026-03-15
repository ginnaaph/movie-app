import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, View } from "react-native";

export default function Index() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-primary">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }}
      >
        <Image
          source={icons.movies}
          resizeMode="contain"
          style={styles.movieIcon}
        />
        <View className="flex-1 items-center justify-center">
          <SearchBar
            onPress={() => router.push("/search")}
            placeholder="Search for movies, TV shows, actors..."
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  movieIcon: {
    width: 48,
    height: 40,
    marginTop: 80,
    marginBottom: 20,
    alignSelf: "center",
  },
});
