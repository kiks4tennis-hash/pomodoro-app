import React from "react";
import { Host, Gauge } from "@expo/ui/swift-ui";
import { frame, gaugeStyle, tint } from "@expo/ui/swift-ui/modifiers";

interface Props { progress: number; color: string; trackColor: string }

export default function TimerProgressRing({ progress, color }: Props) {
  return <Host style={{ position: "absolute", width: 300, height: 300 }}>
    <Gauge value={progress} modifiers={[gaugeStyle("circularCapacity"), tint(color), frame({ width: 300, height: 300 })]} />
  </Host>;
}
