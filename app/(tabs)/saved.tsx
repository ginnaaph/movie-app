import SavedCard from "@/components/SavedMovieCard";
import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icon";
import { images } from "@/constants/images";
import { createList, getListItems, getLists } from "@/services/appwrite";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Saved = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [lists, setLists] = useState<MovieList[]>([]);
  const [itemsByList, setItemsByList] = useState<Record<string, ListItem[]>>({});
  const [expandedListIds, setExpandedListIds] = useState<string[]>([]);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedLists = await getLists();
        const listItems = await Promise.all(
          loadedLists.map(async (list) => [list.$id, await getListItems(list.$id)] as const),
        );

        setLists(loadedLists);
        setItemsByList(Object.fromEntries(listItems));
        setExpandedListIds(
          loadedLists
            .filter(
              (list) => list.slug === "saved-list" || list.slug === "watched-list",
            )
            .map((list) => list.$id),
        );
      } catch {
        setError("Failed to load your lists.");
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      loadLibrary();
    }
  }, [isFocused]);

  const handleCreateList = async () => {
    if (!newListName.trim() || creating) {
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const list = await createList(newListName);

      setLists((current) => [...current, list].sort((left, right) => {
        if (left.is_default !== right.is_default) return left.is_default ? -1 : 1;
        if (left.type !== right.type) return left.type === "system" ? -1 : 1;
        return left.name.localeCompare(right.name);
      }));
      setItemsByList((current) => ({ ...current, [list.$id]: [] }));
      setExpandedListIds((current) => [...current, list.$id]);
      setNewListName("");
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "List could not be created.",
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleList = (listId: string) => {
    setExpandedListIds((current) =>
      current.includes(listId)
        ? current.filter((id) => id !== listId)
        : [...current, listId],
    );
  };

  const totalSaved = Object.entries(itemsByList)
    .filter(([listId]) => lists.find((list) => list.$id === listId)?.slug !== "watched-list")
    .reduce((count, [, items]) => count + items.length, 0);

  return (
    <View className="bg-primary flex-1">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 24 }}
      >
        <Image
          source={icons.movie}
          resizeMode="contain"
          style={styles.movieIcon}
        />
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            className="mt-10 self-center"
          />
        ) : error ? (
          <Text className="text-white mt-10">Error: {error}</Text>
        ) : (
          <View className="flex-1 mt-5">
            <SearchBar
              onPress={() => router.push("/search")}
              placeholder="Find movies to add to your lists..."
            />

            <View className="mt-6 rounded-[28px] border border-white/10 bg-[#18232B]/90 px-5 py-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xl text-white font-bold">Your Lists</Text>
                  <Text className="text-accent mt-1">
                    {lists.length} lists • {totalSaved} saved movies
                  </Text>
                </View>
                <View className="flex-row items-center gap-x-2">
                  <Image
                    source={icons.saved}
                    className="size-4"
                    tintColor="#E77023"
                  />
                  <Text className="text-accentLight text-sm font-medium">
                    Library
                  </Text>
                </View>
              </View>

              <View className="mt-5 gap-y-3">
                <TextInput
                  value={newListName}
                  onChangeText={setNewListName}
                  placeholder="Create a new custom list"
                  placeholderTextColor="#88A0B0"
                  className="rounded-2xl border border-white/10 bg-primary/60 px-4 py-3 text-white"
                />
                <TouchableOpacity
                  className="rounded-2xl bg-accentLight px-4 py-3"
                  onPress={handleCreateList}
                  disabled={creating}
                >
                  <Text className="text-center text-white font-semibold">
                    {creating ? "Creating list..." : "Create List"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-8 gap-y-4">
              {lists.map((list) => {
                const items = itemsByList[list.$id] ?? [];
                const expanded = expandedListIds.includes(list.$id);

                return (
                  <View
                    key={list.$id}
                    className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-5"
                  >
                    <TouchableOpacity
                      className="flex-row items-center justify-between"
                      onPress={() => toggleList(list.$id)}
                    >
                      <View className="flex-1 pr-4">
                        <View className="flex-row items-center gap-x-2">
                          <Text className="text-white text-lg font-bold">
                            {list.name}
                          </Text>
                          {list.slug === "watched-list" ? (
                            <View className="rounded-full bg-accentLight/20 px-2 py-1">
                              <Text className="text-accentLight text-xs font-semibold">
                                Watched
                              </Text>
                            </View>
                          ) : list.slug === "saved-list" ? (
                            <View className="rounded-full bg-white/10 px-2 py-1">
                              <Text className="text-white text-xs font-semibold">
                                Default
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-accent mt-2">
                          {items.length} {items.length === 1 ? "movie" : "movies"}
                        </Text>
                      </View>

                      <Image
                        source={icons.arrow}
                        className={`size-4 ${expanded ? "rotate-90" : ""}`}
                        tintColor="#D47373"
                      />
                    </TouchableOpacity>

                    {expanded ? (
                      items.length > 0 ? (
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="mt-4"
                          data={items}
                          contentContainerStyle={{ paddingRight: 20 }}
                          renderItem={({ item, index }) => (
                            <SavedCard movie={item} index={index} />
                          )}
                          keyExtractor={(item) => item.$id}
                          ItemSeparatorComponent={() => <View className="w-4" />}
                        />
                      ) : (
                        <View className="mt-4 rounded-2xl border border-white/10 bg-primary/40 px-4 py-5">
                          <Text className="text-white text-base font-semibold">
                            No movies here yet
                          </Text>
                          <Text className="text-light-200 mt-2 leading-5">
                            Add movies from the details screen to build this list.
                          </Text>
                        </View>
                      )
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
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
