import React from "react";
import { View } from "react-native";

interface Props { progress: number; color: string; trackColor: string }

export default function TimerProgressRing({ progress, color, trackColor }: Props) {
  return <View accessibilityLabel={`${Math.round(progress * 100)}%`} style={{ position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 8, borderColor: trackColor }}>
    <View style={{ position: "absolute", top: -8, left: -8, width: 240, height: 240, borderRadius: 120, borderWidth: 8, borderTopColor: progress > 0 ? color : "transparent", borderRightColor: progress > 0.25 ? color : "transparent", borderBottomColor: progress > 0.5 ? color : "transparent", borderLeftColor: progress > 0.75 ? color : "transparent", transform: [{ rotate: "-45deg" }] }} />
  </View>;
}
