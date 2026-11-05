import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import * as Localization from "expo-localization";
import { useTimer } from "../hooks/useTimer";
import { requestNotificationPermission } from "../lib/notifications";
import { loadSettings, saveSettings, appendSession } from "../lib/storage";
import { BREAK_PRESETS, DEFAULT_SETTINGS, FOCUS_PRESETS, SessionRecord, TimerSettings, LanguagePreference } from "../types";
import { colors } from "../theme";
import { resolveLanguage, t } from "../i18n";

function formatTime(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, "0")}:${Math.floor(totalSeconds % 60).toString().padStart(2, "0")}`;
}

interface TimerScreenProps { onLanguageChange: (preference: LanguagePreference) => void }

export default function TimerScreen({ onLanguageChange }: TimerScreenProps) {
  useKeepAwake();
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((saved) => {
      setSettings(saved);
      setSettingsLoaded(true);
      onLanguageChange(saved.language);
    });
  }, [onLanguageChange]);

  const language = resolveLanguage(settings.language, Localization.getLocales()[0]?.languageCode);
  const text = t(language);
  useEffect(() => {
    if (settingsLoaded) void requestNotificationPermission(language);
  }, [language, settingsLoaded]);

  const timer = useTimer({ settings, language, onSessionComplete: (record: SessionRecord) => { void appendSession(record); } });
  const updateSettings = async (partial: Partial<TimerSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(next);
    if (partial.language) onLanguageChange(partial.language);
  };

  if (!settingsLoaded) return <View style={styles.loading}><Text style={styles.muted}>{text.loading}</Text></View>;

  const accent = timer.mode === "focus" ? colors.focus : colors.break;
  const progress = timer.totalSeconds > 0 ? 1 - timer.remainingSeconds / timer.totalSeconds : 0;
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: "system", label: text.system }, { value: "ja", label: text.japanese }, { value: "en", label: text.english },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>POMODORO</Text>
        <Text style={[styles.modeLabel, { color: accent }]}>{timer.mode === "focus" ? text.focus : text.rest}</Text>
      </View>

      <View style={styles.timerCard}>
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: accent }]} />
        </View>
        <Text style={styles.timerText}>{formatTime(timer.remainingSeconds)}</Text>
        <Text style={styles.timerHint}>{timer.isRunning ? (language === "ja" ? "いいペースです" : "You're doing great") : (language === "ja" ? "自分のペースで" : "At your own pace")}</Text>
      </View>

      <View style={styles.controlsRow}>
        {!timer.isRunning ? (
          <Pressable style={[styles.mainButton, { backgroundColor: accent }]} onPress={timer.start}>
            <Text style={styles.mainButtonText}>{text.start}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.mainButton, { backgroundColor: colors.buttonBg }]} onPress={timer.pause}>
            <Text style={styles.mainButtonText}>{text.pause}</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={timer.reset}><Text style={styles.secondaryButtonText}>{text.reset}</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={timer.skip}><Text style={styles.secondaryButtonText}>{text.skip}</Text></Pressable>
      </View>

      {!timer.isRunning && (
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{text.focusLength}</Text>
          <View style={styles.presetsRow}>{FOCUS_PRESETS.map((min) => (
            <Pressable key={min} style={[styles.presetChip, settings.focusMinutes === min && { backgroundColor: colors.focus, borderColor: colors.focus }]} onPress={() => void updateSettings({ focusMinutes: min })}>
              <Text style={[styles.presetChipText, settings.focusMinutes === min && styles.activeChipText]}>{min}</Text>
            </Pressable>
          ))}</View>
          <Text style={styles.sectionTitle}>{text.breakLength}</Text>
          <View style={styles.presetsRow}>{BREAK_PRESETS.map((min) => (
            <Pressable key={min} style={[styles.presetChip, settings.breakMinutes === min && { backgroundColor: colors.break, borderColor: colors.break }]} onPress={() => void updateSettings({ breakMinutes: min })}>
              <Text style={[styles.presetChipText, settings.breakMinutes === min && styles.activeChipText]}>{min}</Text>
            </Pressable>
          ))}</View>
          <Pressable style={styles.toggleRow} onPress={() => void updateSettings({ autoStartBreak: !settings.autoStartBreak })}>
            <View style={[styles.checkbox, settings.autoStartBreak && styles.checkboxActive]} />
            <Text style={styles.toggleLabel}>{text.autoBreak}</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>{text.language}</Text>
          <View style={styles.presetsRow}>{languageOptions.map((option) => (
            <Pressable key={option.value} style={[styles.languageChip, settings.language === option.value && styles.languageChipActive]} onPress={() => void updateSettings({ language: option.value })}>
              <Text style={[styles.presetChipText, settings.language === option.value && styles.activeChipText]}>{option.label}</Text>
            </Pressable>
          ))}</View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { flexGrow: 1, backgroundColor: colors.background, alignItems: "center", paddingTop: 42, paddingBottom: 36, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 24 },
  eyebrow: { color: colors.textMuted, fontSize: 11, letterSpacing: 3, fontWeight: "700", marginBottom: 8 },
  modeLabel: { fontSize: 22, fontWeight: "700", letterSpacing: 1 },
  timerCard: { width: "100%", maxWidth: 390, minHeight: 250, borderRadius: 30, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 28, marginBottom: 24, shadowColor: "#4F4439", shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  track: { width: "100%", height: 5, backgroundColor: colors.track, borderRadius: 4, overflow: "hidden", marginBottom: 35 },
  progress: { height: "100%", borderRadius: 4 },
  timerText: { fontSize: 68, fontWeight: "600", letterSpacing: -2, color: colors.text, fontVariant: ["tabular-nums"] },
  timerHint: { color: colors.textMuted, fontSize: 13, marginTop: 10 },
  controlsRow: { flexDirection: "row", gap: 10, marginBottom: 20, alignItems: "center" },
  mainButton: { minWidth: 128, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 24, alignItems: "center" },
  mainButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: { paddingVertical: 15, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.surface },
  secondaryButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  settingsCard: { width: "100%", maxWidth: 440, backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 13, fontWeight: "700", marginTop: 10, marginBottom: 12 },
  presetsRow: { flexDirection: "row", gap: 9, flexWrap: "wrap" },
  presetChip: { minWidth: 52, alignItems: "center", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 17, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.surfaceAlt },
  languageChip: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.surfaceAlt },
  languageChipActive: { backgroundColor: colors.buttonBg, borderColor: colors.buttonBg },
  presetChipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  activeChipText: { color: "#FFFFFF" },
  toggleRow: { flexDirection: "row", alignItems: "center", marginTop: 22, gap: 11 },
  checkbox: { width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.focus, borderColor: colors.focus },
  toggleLabel: { color: colors.text, fontSize: 13, flexShrink: 1 },
  muted: { color: colors.textMuted },
});
