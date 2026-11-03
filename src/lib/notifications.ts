import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { TimerMode } from "../types";

// 通知が来たときアプリがフォアグラウンドでも音とバナーを出す設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("timer", {
      name: "タイマー通知",
      importance: Notifications.AndroidImportance.MAX,
      // 消音/おやすみモード中でも通知が確実に届くよう優先度を最大にする
      sound: "default",
    });
  }

  return finalStatus === "granted";
}

// タイマー終了時に即時発火する通知を送る
export async function sendTimerEndNotification(mode: TimerMode): Promise<void> {
  const title = mode === "focus" ? "集中セッション終了！" : "休憩終了！";
  const body = mode === "focus" ? "お疲れさまでした。休憩しましょう。" : "次の集中セッションを始めましょう。";

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null, // 即時発火
  });
}
