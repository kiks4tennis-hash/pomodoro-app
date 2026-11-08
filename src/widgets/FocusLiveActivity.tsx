import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { font, frame, labelStyle, monospacedDigit } from "@expo/ui/swift-ui/modifiers";
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
  const isJa = props.language === "ja";
  const label = props.mode === "focus" ? (isJa ? "集中タイム" : "Focus") : (isJa ? "休憩タイム" : "Break");
  const countdownFrame = frame({ width: 140, height: 52, alignment: "center" });
  const compactCountdownFrame = frame({ width: 72, alignment: "center" });
  const remainingTime = `${Math.floor(props.remainingSeconds / 60).toString().padStart(2, "0")}:${Math.floor(props.remainingSeconds % 60).toString().padStart(2, "0")}`;
  const timerInterval = { lower: new Date(props.startAt), upper: new Date(props.endAt) };
  const countdown = props.paused
    ? <Text modifiers={[font({ size: 44, weight: "bold" }), monospacedDigit(), countdownFrame]}>{remainingTime}</Text>
    : <Text modifiers={[font({ size: 44, weight: "bold" }), monospacedDigit(), countdownFrame]} timerInterval={timerInterval} countsDown />;
  const compactCountdown = props.paused
    ? <Text modifiers={[font({ size: 16, weight: "semibold" }), monospacedDigit(), compactCountdownFrame]}>{remainingTime}</Text>
    : <Text modifiers={[font({ size: 16, weight: "semibold" }), monospacedDigit(), compactCountdownFrame]} timerInterval={timerInterval} countsDown />;
  const controlTarget = props.paused ? "focus-timer-resume" : "focus-timer-pause";
  const controlLabel = props.paused ? (isJa ? "再開" : "Resume") : (isJa ? "一時停止" : "Pause");
  const controlButton = <Button label={controlLabel} systemImage={props.paused ? "play.fill" : "pause.fill"} target={controlTarget} modifiers={[labelStyle("iconOnly"), font({ size: 28, weight: "bold" }), frame({ width: 164, height: 64, alignment: "center" })]} />;
  return {
    banner: (
      <HStack modifiers={[frame({ width: 360, height: 72 })]}>
        <Spacer />
        {controlButton}
        <Spacer />
        {countdown}
        <Spacer />
      </HStack>
    ),
    compactLeading: <Image systemName="timer" />,
    compactTrailing: compactCountdown,
    minimal: <Image systemName="timer" />,
    expandedLeading: <VStack><Text>{label}</Text>{controlButton}</VStack>,
    expandedTrailing: countdown,
    expandedBottom: <Text>{isJa ? "ポモドーロタイマー" : "Pomodoro Timer"}</Text>,
  };
}

export const FocusLiveActivity = createLiveActivity<FocusActivityProps>("FocusActivity", FocusActivity);

