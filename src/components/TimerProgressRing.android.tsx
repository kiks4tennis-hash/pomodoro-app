import React from "react";
import { Host, CircularProgressIndicator } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";

interface Props { progress: number; color: string; trackColor: string }

export default function TimerProgressRing({ progress, color, trackColor }: Props) {
  return <Host style={{ position: "absolute", width: 300, height: 300 }}>
    <CircularProgressIndicator progress={progress} color={color} trackColor={trackColor} strokeWidth={8} modifiers={[size(290, 290)]} />
  </Host>;
}
