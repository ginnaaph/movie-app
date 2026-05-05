import FrameLogWordmark from "@/components/FrameLogWordmark";
import SavedCard from "@/components/SavedMovieCard";
import SearchBar from "@/components/SearchBar";
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
            .filter((list) => list.slug === "saved-list" || list.slug === "watched-list")
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
    if (!newListName.trim() || creating) return;

    try {
      setCreating(true);
      setError(null);
      const list = await createList(newListName);

      setLists((current) =>
        [...current, list].sort((left, right) => {
          if (left.is_default !== right.is_default) return left.is_default ? -1 : 1;
          if (left.type !== right.type) return left.type === "system" ? -1 : 1;
          return left.name.localeCompare(right.name);
        }),
      );
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
    <View className="flex-1 bg-primary">
      <Image source={images.navybg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 66 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#3AB0FF" className="mt-20 self-center" />
        ) : (
          <>
            <View className="items-center px-2">
              <FrameLogWordmark scale={1.8} />
            </View>

            <View className="px-2">
              <View className="mt-5 flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-3xl font-bold text-white">Saved</Text>
                  <Text className="mt-2 text-sm leading-6 text-[#9FD6E3]">
                    Build lists for movies and TV shows you want to watch next.
                  </Text>
                </View>

                <View className="mt-1 items-end">
                  <Text className="text-3xl font-bold text-white">{totalSaved}</Text>
                  <Text className="mt-1 text-sm text-white/70">queued titles</Text>
                </View>
              </View>

              <View className="mt-5">
                <SearchBar
                  onPress={() => router.push("/search")}
                  placeholder="Find more titles to save..."
                />
              </View>

              <View className="mt-6">
                <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-[#9FD6E3]">
                  Create List
                </Text>
                <View className="mt-3 flex-row items-center gap-x-3">
                  <TextInput
                    value={newListName}
                    onChangeText={setNewListName}
                    placeholder="Weekend, Favorites, Rewatch..."
                    placeholderTextColor="#88A0B0"
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                  />
                  <TouchableOpacity
                    className="rounded-2xl bg-accentLight px-4 py-3"
                    onPress={handleCreateList}
                    disabled={creating}
                  >
                    <Text className="font-semibold text-white">
                      {creating ? "..." : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {error ? <Text className="mt-3 text-sm text-[#F28B82]">{error}</Text> : null}
              </View>
            </View>

            <View className="mt-8 gap-y-7">
              {lists.map((list) => {
                const items = itemsByList[list.$id] ?? [];
                const expanded = expandedListIds.includes(list.$id);
                const label =
                  list.slug === "watched-list"
                    ? "Watched"
                    : list.slug === "saved-list"
                      ? "Default"
                      : list.type === "custom"
                        ? "Custom"
                        : "";

                return (
                  <View key={list.$id}>
                    <TouchableOpacity
                      className="flex-row items-end justify-between px-2"
                      onPress={() => toggleList(list.$id)}
                    >
                      <View className="flex-1 pr-4">
                        <View className="flex-row items-center gap-x-3">
                          <Text className="text-2xl font-bold text-white">{list.name}</Text>
                          {label ? (
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-[#9FD6E3]">
                              {label}
                            </Text>
                          ) : null}
                        </View>
                        <Text className="mt-2 text-sm text-white/70">
                          {items.length} {items.length === 1 ? "title" : "titles"}
                        </Text>
                      </View>

                      <Text className="text-2xl font-semibold text-white/80">
                        {expanded ? "−" : "+"}
                      </Text>
                    </TouchableOpacity>

                    {expanded ? (
                      items.length > 0 ? (
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="mt-4"
                          data={items}
                          contentContainerStyle={{ paddingLeft: 8, paddingRight: 20 }}
                          renderItem={({ item, index }) => (
                            <SavedCard movie={item} index={index} />
                          )}
                          keyExtractor={(item) => item.$id}
                          ItemSeparatorComponent={() => <View className="w-4" />}
                        />
                      ) : (
                        <View className="mt-4 px-2">
                          <Text className="text-white text-base font-semibold">
                            No titles here yet
                          </Text>
                          <Text className="mt-2 leading-6 text-white/70">
                            Add movies or TV shows from the details page to build this list.
                          </Text>
                        </View>
                      )
                    ) : null}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Saved;
