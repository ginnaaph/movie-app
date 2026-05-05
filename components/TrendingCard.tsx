import MaskedView from "@react-native-masked-view/masked-view";
import { Href, Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

const TrendingCard = ({
  movie: { movie_id, media_id, media_type = "movie", title, poster_url },
  index,
}: TrendingCardProps) => {
  const mediaId = media_id ?? movie_id;
  const href = {
    pathname: media_type === "tv" ? "/tv/[id]" : "/movies/[id]",
    params: { id: mediaId.toString() },
  } as Href;

  return (
    <Link href={href} asChild>
      <TouchableOpacity className="w-32 relative pl-5">
        <Image
          source={{ uri: poster_url }}
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
        <Text className="mt-1 text-xs text-accent">
          {media_type === "tv" ? "TV Show" : "Movie"}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default TrendingCard;
