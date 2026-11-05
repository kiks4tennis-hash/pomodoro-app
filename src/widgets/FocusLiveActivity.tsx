import { HStack, Text, VStack } from "@expo/ui/swift-ui";
import { createLiveActivity } from "expo-widgets";
import { AppLanguage, TimerMode } from "../types";

export interface FocusActivityProps {
  mode: TimerMode;
  startAt: number;
  endAt: number;
  remainingSeconds: number;
  language: AppLanguage;
  paused: boolean;
}

function FocusActivity(props: FocusActivityProps) {
  'widget';
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  const isJa = props.language === "ja";
  const label = props.mode === "focus" ? (isJa ? "集中タイム" : "Focus") : (isJa ? "休憩タイム" : "Break");
  const countdown = props.paused
    ? <Text>{formatTime(props.remainingSeconds)}</Text>
    : <Text timerInterval={{ lower: new Date(props.startAt), upper: new Date(props.endAt) }} countsDown />;
  return {
    banner: <HStack><VStack><Text>{label}</Text>{countdown}</VStack></HStack>,
    compactLeading: <Text>{props.mode === "focus" ? "●" : "○"}</Text>,
    compactTrailing: countdown,
    minimal: <Text>{props.mode === "focus" ? "●" : "○"}</Text>,
    expandedLeading: <VStack><Text>{label}</Text></VStack>,
    expandedTrailing: countdown,
    expandedBottom: <Text>{isJa ? "ポモドーロタイマー" : "Pomodoro Timer"}</Text>,
  };
}

export const FocusLiveActivity = createLiveActivity<FocusActivityProps>("FocusActivity", FocusActivity);
