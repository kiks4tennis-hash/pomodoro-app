import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface Props { progress: number; color: string; trackColor: string }

const RING_SIZE = 310;
const STROKE_WIDTH = 12;
const CENTER = RING_SIZE / 2;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerProgressRing({ progress, color, trackColor }: Props) {
  const safeProgress = Math.min(1, Math.max(0, progress));
  return (
    <View
      accessibilityLabel={`${Math.round(safeProgress * 100)}%`}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.centered]}
    >
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={trackColor} strokeWidth={STROKE_WIDTH} />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - safeProgress)}
          rotation={-90}
          origin={`${CENTER}, ${CENTER}`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ centered: { alignItems: "center", justifyContent: "center" } });

