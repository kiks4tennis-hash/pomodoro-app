import { AppLanguage, LanguagePreference } from "./types";

export function resolveLanguage(preference: LanguagePreference): AppLanguage {
  return preference;
}

const ja = {
  focus: "集中タイム", rest: "休憩タイム", start: "開始", pause: "一時停止", reset: "リセット", skip: "スキップ",
  loading: "読み込み中…", focusLength: "集中時間（分）", breakLength: "休憩時間（分）", autoBreak: "集中後に休憩を自動で開始",
  language: "表示言語", japanese: "日本語", english: "English", today: "今日", week: "今週",
  focusSets: "完了した集中", focusMinutes: "集中した時間（分）", weeklyTitle: "週間の振り返り", dailyAverage: "1日平均",
  activeDays: "取り組んだ日", bestDay: "一番集中した日", sessions: "セッション", noSessions: "まだ記録がありません。",
  todaySessions: "今日のセッション", weeklySessions: "今週のセッション", skipped: "途中終了", min: "分", mon: "月", tue: "火", wed: "水", thu: "木", fri: "金", sat: "土", sun: "日",
  save: "保存", settings: "設定", sound: "終了音", customMinutes: "分で設定", validFocus: "集中時間は1〜180分で設定してください", validBreak: "休憩時間は1〜60分で設定してください", soundSoft: "やさしいベル", soundChime: "ソフトチャイム", soundWarm: "あたたかい音", focusPresets: "集中時間ボタン（分）", breakPresets: "休憩時間ボタン（分）",
};
const en = {
  focus: "Focus time", rest: "Break time", start: "Start", pause: "Pause", reset: "Reset", skip: "Skip",
  loading: "Loading…", focusLength: "Focus length (min)", breakLength: "Break length (min)", autoBreak: "Start a break automatically",
  language: "Language", japanese: "日本語", english: "English", today: "Today", week: "This week",
  focusSets: "Completed focus sessions", focusMinutes: "Focus minutes", weeklyTitle: "Weekly review", dailyAverage: "Daily average",
  activeDays: "Active days", bestDay: "Most focused day", sessions: "Sessions", noSessions: "No sessions yet.",
  todaySessions: "Today's sessions", weeklySessions: "This week's sessions", skipped: "Ended early", min: "min", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
  save: "Save", settings: "Settings", sound: "Timer sound", customMinutes: "Set minutes", validFocus: "Choose a focus length from 1 to 180 minutes", validBreak: "Choose a break length from 1 to 60 minutes", soundSoft: "Gentle bell", soundChime: "Soft chime", soundWarm: "Warm tone", focusPresets: "Focus buttons (min)", breakPresets: "Break buttons (min)",
};

export type TranslationKey = keyof typeof en;
export function t(language: AppLanguage): Record<TranslationKey, string> {
  return language === "ja" ? ja : en;
}
