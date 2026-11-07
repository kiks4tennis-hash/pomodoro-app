import React from "react";
import { View } from "react-native";

interface Props { progress: number; color: string; trackColor: string }

export default function TimerProgressRing({ progress, color, trackColor }: Props) {
  return <View accessibilityLabel={`${Math.round(progress * 100)}%`} style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, borderWidth: 9, borderColor: trackColor }}>
    <View style={{ position: "absolute", top: -9, left: -9, width: 300, height: 300, borderRadius: 150, borderWidth: 9, borderTopColor: progress > 0 ? color : "transparent", borderRightColor: progress > 0.25 ? color : "transparent", borderBottomColor: progress > 0.5 ? color : "transparent", borderLeftColor: progress > 0.75 ? color : "transparent", transform: [{ rotate: "-45deg" }] }} />
  </View>;
}
