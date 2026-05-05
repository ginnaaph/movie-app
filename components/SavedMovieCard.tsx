import MaskedView from "@react-native-masked-view/masked-view";
import { Href, Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export const SavedMovieCard = ({
  movie: { movie_id, media_id, media_type = "movie", title, poster_url, release_date, vote_average },
  index,
}: SavedMovieCardProps) => {
  const itemId = media_id ?? movie_id;
  const href = {
    pathname: media_type === "tv" ? "/tv/[id]" : "/movies/[id]",
    params: { id: itemId.toString() },
  } as Href;

  return (
    <Link href={href} asChild>
      <TouchableOpacity className="w-32 relative pl-5">
        <Image
          source={{
            uri: poster_url || "https://placehold.co/600x400/1a1a1a.png",
          }}
          className="w-32 h-48 rounded-lg"
          resizeMode="cover"
        />

        <View className="absolute bottom-9 -left-3.5 px-2 py-1 rounded-full">
          <MaskedView
            maskElement={
              <Text className="font-bold text-white text-6xl">{index + 1}</Text>
            }
          >
            <Image className="size-14" resizeMode="cover" />
          </MaskedView>
        </View>

        <Text
          className="text-sm font-semibold mt-2 text-white"
          numberOfLines={2}
        >
          {title}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-xs text-slateGrey">
            {release_date?.split("-")[0] || (media_type === "tv" ? "TV" : "Movie")}
          </Text>
          <Text className="text-xs text-accent">
            {vote_average ? `${Math.round(vote_average / 2)}/5` : ""}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default SavedMovieCard;
