// タイマーの現在モード
export type TimerMode = "focus" | "break";
export type LanguagePreference = "ja" | "en";
export type TimerSound = "gentle-bell.wav" | "soft-chime.wav" | "warm-tone.wav";
export type AppLanguage = "ja" | "en";

// タイマー本体の状態
export interface TimerState {
  mode: TimerMode;
  remainingSeconds: number;
  isRunning: boolean;
  // 現在のモードの合計秒数（残り時間の割合表示に使う）
  totalSeconds: number;
}

// ユーザーが設定できるタイマーの長さ（分単位）
export interface TimerSettings {
  focusMinutes: number;
  breakMinutes: number;
  // true: 集中セッション終了後、自動で休憩に入る
  autoStartBreak: boolean;
  language: LanguagePreference;
  sound: TimerSound;
}

// 完了したセッション1件分の記録
export interface SessionRecord {
  id: string;
  mode: TimerMode;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  durationSeconds: number;
  completed: boolean; // 最後まで完了したか、途中スキップ/中断したか
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  autoStartBreak: false,
  language: "ja",
  sound: "gentle-bell.wav",
};
