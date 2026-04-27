import React from "react";
import { Text, View } from "react-native";

type FrameLogWordmarkProps = {
  scale?: number;
};

const FrameLogWordmark = ({ scale = 1 }: FrameLogWordmarkProps) => {
  const iconSize = 28 * scale;
  const chipWidth = 4 * scale;
  const chipHeight = 3.5 * scale;

  return (
    <View className="flex-row items-center justify-center">
      <View
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 7 * scale,
          backgroundColor: "#0F1120",
          borderWidth: 1.5 * scale,
          borderColor: "#20265C",
        }}
        className="relative items-center justify-center"
      >
        {[6, 12.5, 19].map((top, index) => (
          <View
            key={`left-${index}`}
            style={{
              position: "absolute",
              left: 2.5 * scale,
              top: top * scale,
              width: chipWidth,
              height: chipHeight,
              borderRadius: 1.25 * scale,
              backgroundColor: "rgba(77,126,247,0.5)",
            }}
          />
        ))}
        {[6, 12.5, 19].map((top, index) => (
          <View
            key={`right-${index}`}
            style={{
              position: "absolute",
              right: 2.5 * scale,
              top: top * scale,
              width: chipWidth,
              height: chipHeight,
              borderRadius: 1.25 * scale,
              backgroundColor: "rgba(77,126,247,0.5)",
            }}
          />
        ))}

        <View
          style={{
            width: 14 * scale,
            height: 18 * scale,
            borderRadius: 2.25 * scale,
            backgroundColor: "rgba(77,126,247,0.12)",
            borderWidth: 1 * scale,
            borderColor: "rgba(32,38,92,0.35)",
          }}
        />

        <View
          style={{
            position: "absolute",
            left: 7 * scale,
            top: 17 * scale,
            width: 5.5 * scale,
            height: 1.5 * scale,
            borderRadius: 999,
            backgroundColor: "#4D7EF7",
            transform: [{ rotate: "-55deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 11 * scale,
            top: 15 * scale,
            width: 4.5 * scale,
            height: 1.5 * scale,
            borderRadius: 999,
            backgroundColor: "#4D7EF7",
            transform: [{ rotate: "28deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 14.5 * scale,
            top: 12.5 * scale,
            width: 7 * scale,
            height: 1.5 * scale,
            borderRadius: 999,
            backgroundColor: "#4D7EF7",
            transform: [{ rotate: "-60deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 5.5 * scale,
            top: 9 * scale,
            width: 3.5 * scale,
            height: 3.5 * scale,
            borderRadius: 999,
            backgroundColor: "#4D7EF7",
          }}
        />
      </View>

      <View className="ml-2 flex-row items-baseline">
        <Text
          style={{
            fontSize: 18 * scale,
            lineHeight: 20 * scale,
            color: "#4D7EF7",
            fontWeight: "700",
            letterSpacing: -0.6 * scale,
          }}
        >
          frame
        </Text>
        <Text
          style={{
            fontSize: 18 * scale,
            lineHeight: 20 * scale,
            color: "#D47373",
            fontWeight: "300",
            letterSpacing: -0.6 * scale,
          }}
        >
          log
        </Text>
      </View>
    </View>
  );
};

export default FrameLogWordmark;
