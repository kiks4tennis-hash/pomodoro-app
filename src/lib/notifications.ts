import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { AppLanguage, TimerMode } from "../types";

const CHANNEL_ID = "timer-gentle-v1";
const SOUND = "gentle-bell.wav";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(language: AppLanguage): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: language === "ja" ? "タイマーの終了" : "Timer alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: SOUND,
      vibrationPattern: [0, 180, 120, 180],
    });
  }
  return finalStatus === "granted";
}

export async function scheduleTimerEndNotification(
  mode: TimerMode,
  endAt: number,
  language: AppLanguage
): Promise<string> {
  const ja = language === "ja";
  const title = mode === "focus"
    ? (ja ? "集中タイムが終了しました" : "Focus time is complete")
    : (ja ? "休憩タイムが終了しました" : "Break time is over");
  const body = mode === "focus"
    ? (ja ? "お疲れさまでした。ひと息つきましょう。" : "Well done. Take a moment to rest.")
    : (ja ? "次の集中タイムを始めましょう。" : "Ready for your next focus session?");
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: SOUND,
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(endAt),
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
    },
  });
}

export async function cancelTimerEndNotification(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}
