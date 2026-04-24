import { icons } from "@/constants/icon";
import React from "react";
import { Image, TouchableOpacity } from "react-native";

interface Props {
  onPress: () => void;
  isSaved: boolean;
  disabled?: boolean;
}

const SaveButton: React.FC<Props> = ({ onPress, isSaved, disabled = false }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="size-10 rounded-full bg-secondary/20 pt-4 items-center justify-center mr-4"
    >
      <Image
        source={icons.saved}
        className="size-8"
        resizeMode="contain"
        tintColor={isSaved ? "#E77023" : "#88A0B0"}
      />
    </TouchableOpacity>
  );
};

export default SaveButton;
