import React from "react";
import { Host, CircularProgressIndicator } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";

interface Props { progress: number; color: string; trackColor: string }

export default function TimerProgressRing({ progress, color, trackColor }: Props) {
  return <Host style={{ position: "absolute", width: 260, height: 260 }}>
    <CircularProgressIndicator progress={progress} color={color} trackColor={trackColor} strokeWidth={7} modifiers={[size(250, 250)]} />
  </Host>;
}
