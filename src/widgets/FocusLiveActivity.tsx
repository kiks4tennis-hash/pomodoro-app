import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { font } from "@expo/ui/swift-ui/modifiers";
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
    ? <Text modifiers={[font({ size: 48, weight: "bold" })]}>{formatTime(props.remainingSeconds)}</Text>
    : <Text modifiers={[font({ size: 48, weight: "bold" })]} timerInterval={{ lower: new Date(props.startAt), upper: new Date(props.endAt) }} countsDown />;
  const controlTarget = props.paused ? "focus-timer-resume" : "focus-timer-pause";
  const controlLabel = props.paused ? (isJa ? "再開" : "Resume") : (isJa ? "一時停止" : "Pause");
  return {
    banner: (
      <HStack>
        <Image systemName="figure.run" />
        <Button label={controlLabel} systemImage={props.paused ? "play.fill" : "pause.fill"} target={controlTarget} />
        <Spacer />
        {countdown}
      </HStack>
    ),
    compactLeading: <Image systemName="figure.run" />,
    compactTrailing: countdown,
    minimal: <Image systemName="figure.run" />,
    expandedLeading: <VStack><Text>{label}</Text><Button label={controlLabel} systemImage={props.paused ? "play.fill" : "pause.fill"} target={controlTarget} /></VStack>,
    expandedTrailing: countdown,
    expandedBottom: <Text>{isJa ? "ポモドーロタイマー" : "Pomodoro Timer"}</Text>,
  };
}

export const FocusLiveActivity = createLiveActivity<FocusActivityProps>("FocusActivity", FocusActivity);
