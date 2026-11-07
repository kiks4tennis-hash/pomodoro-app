import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, SessionRecord, TimerSettings } from "../types";

const SETTINGS_KEY = "@pomodoro/settings";
const SESSIONS_KEY = "@pomodoro/sessions";

// --- 設定の読み書き ---

export async function loadSettings(systemLanguage?: string | null): Promise<TimerSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<Omit<TimerSettings, "language">> & { language?: string };
    const language = saved.language === "system"
      ? (systemLanguage?.toLowerCase().startsWith("ja") ? "ja" : "en")
      : saved.language;
    return { ...DEFAULT_SETTINGS, ...saved, language: language === "en" ? "en" : "ja" };
  } catch (e) {
    console.warn("設定の読み込みに失敗しました。デフォルト値を使用します。", e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: TimerSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- セッション履歴の読み書き ---

export async function loadSessions(): Promise<SessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch (e) {
    console.warn("セッション履歴の読み込みに失敗しました。", e);
    return [];
  }
}

export async function appendSession(record: SessionRecord): Promise<SessionRecord[]> {
  const sessions = await loadSessions();
  const updated = [...sessions, record];
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  return updated;
}

// 今日の日付範囲に含まれるセッションだけ抽出
export function filterToday(sessions: SessionRecord[]): SessionRecord[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return sessions.filter((s) => s.startedAt >= startOfDay);
}
