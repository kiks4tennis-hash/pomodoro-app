import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { AppLanguage, TimerMode, TimerSound } from "../types";

const SOUND_OPTIONS: TimerSound[] = ["gentle-bell.wav", "water-sound.wav", "warm-tone.wav"];
const channelId = (sound: TimerSound) => `timer-${sound.replace(/[^a-z0-9]/gi, "-")}`;

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
    await Promise.all(SOUND_OPTIONS.map((sound) => Notifications.setNotificationChannelAsync(channelId(sound), {
      name: `${language === "ja" ? "タイマーの終了" : "Timer alerts"} · ${sound.replace(".wav", "")}`,
      importance: Notifications.AndroidImportance.MAX,
      sound,
      vibrationPattern: [0, 180, 120, 180],
    })));
  }
  return finalStatus === "granted";
}

export async function scheduleTimerEndNotification(
  mode: TimerMode,
  endAt: number,
  language: AppLanguage,
  sound: TimerSound
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
      sound,
      ...(Platform.OS === "android" ? { channelId: channelId(sound) } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(endAt),
      ...(Platform.OS === "android" ? { channelId: channelId(sound) } : {}),
    },
  });
}

export async function cancelTimerEndNotification(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}
