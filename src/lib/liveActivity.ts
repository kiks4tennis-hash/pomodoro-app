import { Platform } from "react-native";
import { AppLanguage, TimerMode } from "../types";
import type { FocusActivityProps } from "../widgets/FocusLiveActivity";

let activity: import("expo-widgets").LiveActivity<FocusActivityProps> | null = null;

export async function updateFocusActivity(input: {
  mode: TimerMode;
  startAt: number;
  endAt: number;
  remainingSeconds: number;
  language: AppLanguage;
  paused: boolean;
}): Promise<void> {
  if (Platform.OS !== "ios") return;
  const { FocusLiveActivity } = await import("../widgets/FocusLiveActivity");
  const props: FocusActivityProps = input;
  const current = FocusLiveActivity.getInstances()[0];
  if (current) {
    activity = current;
    await current.update(props);
  } else {
    activity = FocusLiveActivity.start(props, "pomodoro://timer");
  }
}

export async function endFocusActivity(): Promise<void> {
  if (Platform.OS !== "ios") return;
  const { FocusLiveActivity } = await import("../widgets/FocusLiveActivity");
  const instances = FocusLiveActivity.getInstances();
  await Promise.all(instances.map((instance) => instance.end("immediate")));
  activity = null;
}
