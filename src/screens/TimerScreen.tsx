import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import * as Localization from "expo-localization";
import { useTimer } from "../hooks/useTimer";
import { requestNotificationPermission } from "../lib/notifications";
import { loadSettings, saveSettings, appendSession } from "../lib/storage";
import { DEFAULT_SETTINGS, SessionRecord, TimerSettings, LanguagePreference, TimerSound } from "../types";
import { colors } from "../theme";
import { resolveLanguage, t } from "../i18n";

function formatTime(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, "0")}:${Math.floor(totalSeconds % 60).toString().padStart(2, "0")}`;
}

interface TimerScreenProps { onLanguageChange: (language: LanguagePreference) => void }

export default function TimerScreen({ onLanguageChange }: TimerScreenProps) {
  useKeepAwake();
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [focusInput, setFocusInput] = useState(String(DEFAULT_SETTINGS.focusMinutes));
  const [breakInput, setBreakInput] = useState(String(DEFAULT_SETTINGS.breakMinutes));

  useEffect(() => {
    loadSettings(Localization.getLocales()[0]?.languageCode).then((saved) => {
      setSettings(saved);
      setFocusInput(String(saved.focusMinutes));
      setBreakInput(String(saved.breakMinutes));
      setSettingsLoaded(true);
      onLanguageChange(saved.language);
    });
  }, [onLanguageChange]);

  const language = resolveLanguage(settings.language);
  const text = t(language);
  useEffect(() => {
    if (settingsLoaded) void requestNotificationPermission(language);
  }, [language, settingsLoaded]);

  const timer = useTimer({ settings, language, onSessionComplete: (record: SessionRecord) => { void appendSession(record); } });
  const timerRef = useRef(timer);
  timerRef.current = timer;
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let subscription: { remove: () => void } | undefined;
    void import("expo-widgets").then(({ addUserInteractionListener }) => {
      subscription = addUserInteractionListener(({ target }) => {
        if (target === "focus-timer-pause") timerRef.current.pause();
        if (target === "focus-timer-resume") timerRef.current.start();
      });
    });
    return () => subscription?.remove();
  }, []);

  const updateSettings = async (partial: Partial<TimerSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(next);
    if (partial.language) onLanguageChange(partial.language);
  };

  if (!settingsLoaded) return <View style={styles.loading}><Text style={styles.muted}>{text.loading}</Text></View>;
  const accent = timer.mode === "focus" ? colors.focus : colors.break;
  const progress = timer.totalSeconds > 0 ? 1 - timer.remainingSeconds / timer.totalSeconds : 0;
  const soundOptions: { value: TimerSound; label: string }[] = [
    { value: "gentle-bell.wav", label: text.soundSoft },
    { value: "soft-chime.wav", label: text.soundChime },
    { value: "warm-tone.wav", label: text.soundWarm },
  ];

  const saveDurations = () => {
    const focusMinutes = Number(focusInput.trim());
    const breakMinutes = Number(breakInput.trim());
    if (!Number.isInteger(focusMinutes) || focusMinutes < 1 || focusMinutes > 180) {
      Alert.alert(text.settings, text.validFocus);
      return;
    }
    if (!Number.isInteger(breakMinutes) || breakMinutes < 1 || breakMinutes > 60) {
      Alert.alert(text.settings, text.validBreak);
      return;
    }
    void updateSettings({ focusMinutes, breakMinutes });
    setSettingsVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>FOCUS TIMER</Text><Text style={[styles.modeLabel, { color: accent }]}>{timer.mode === "focus" ? text.focus : text.rest}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={text.settings} style={styles.settingsButton} onPress={() => {
          setFocusInput(String(settings.focusMinutes));
          setBreakInput(String(settings.breakMinutes));
          setSettingsVisible(true);
        }}><Text style={styles.settingsButtonText}>⚙</Text></Pressable>
      </View>

      <View style={styles.timerCard}>
        <View style={styles.track}><View style={[styles.progress, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: accent }]} /></View>
        <Text style={styles.timerText}>{formatTime(timer.remainingSeconds)}</Text>
        <Text style={styles.timerHint}>{timer.isRunning ? (language === "ja" ? "いいペースです" : "You're doing great") : (language === "ja" ? "自分のペースで" : "At your own pace")}</Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable accessibilityRole="button" style={[styles.mainButton, { backgroundColor: timer.isRunning ? colors.buttonBg : accent }]} onPress={timer.isRunning ? timer.pause : timer.start}>
          <Text style={styles.mainButtonText}>{timer.isRunning ? text.pause : text.start}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={timer.reset}><Text style={styles.secondaryButtonText}>{text.reset}</Text></Pressable>
        <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={timer.skip}><Text style={styles.secondaryButtonText}>{text.skip}</Text></Pressable>
      </View>
      <Text style={styles.durationSummary}>{settings.focusMinutes} {text.min} · {settings.breakMinutes} {text.min}</Text>

      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsVisible(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{text.settings}</Text><Pressable accessibilityRole="button" accessibilityLabel={text.reset} onPress={() => setSettingsVisible(false)}><Text style={styles.closeText}>×</Text></Pressable></View>
            <Text style={styles.sectionTitle}>{text.focusLength}</Text>
            <View style={styles.inputRow}><TextInput accessibilityLabel={text.focusLength} value={focusInput} onChangeText={setFocusInput} keyboardType="number-pad" returnKeyType="done" style={styles.durationInput} maxLength={3}/><Text style={styles.inputUnit}>{text.min}</Text></View>
            <Text style={styles.sectionTitle}>{text.breakLength}</Text>
            <View style={styles.inputRow}><TextInput accessibilityLabel={text.breakLength} value={breakInput} onChangeText={setBreakInput} keyboardType="number-pad" returnKeyType="done" style={styles.durationInput} maxLength={2}/><Text style={styles.inputUnit}>{text.min}</Text></View>
            <Pressable style={styles.toggleRow} onPress={() => void updateSettings({ autoStartBreak: !settings.autoStartBreak })}><View style={[styles.checkbox, settings.autoStartBreak && styles.checkboxActive]} /><Text style={styles.toggleLabel}>{text.autoBreak}</Text></Pressable>
            <Text style={styles.sectionTitle}>{text.sound}</Text>
            <View style={styles.optionList}>{soundOptions.map((option) => <Pressable key={option.value} style={[styles.option, settings.sound === option.value && styles.optionSelected]} onPress={() => void updateSettings({ sound: option.value })}><Text style={styles.optionText}>{option.label}</Text><Text style={styles.optionCheck}>{settings.sound === option.value ? "✓" : ""}</Text></Pressable>)}</View>
            <Text style={styles.sectionTitle}>{text.language}</Text>
            <View style={styles.presetsRow}>{([{ value: "ja", label: text.japanese }, { value: "en", label: text.english }] as const).map((option) => <Pressable key={option.value} style={[styles.languageChip, settings.language === option.value && styles.languageChipActive]} onPress={() => void updateSettings({ language: option.value })}><Text style={[styles.presetChipText, settings.language === option.value && styles.activeChipText]}>{option.label}</Text></Pressable>)}</View>
            <Pressable style={styles.saveButton} onPress={saveDurations}><Text style={styles.saveButtonText}>{text.save}</Text></Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", backgroundColor: colors.background, alignItems: "center", paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24 },
  header: { width: "100%", maxWidth: 440, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  eyebrow: { color: colors.textMuted, fontSize: 12, letterSpacing: 2.4, fontWeight: "700", marginBottom: 6 },
  modeLabel: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2 },
  settingsButton: { width: 50, height: 50, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  settingsButtonText: { color: colors.text, fontSize: 25, fontWeight: "500" },
  timerCard: { width: "100%", maxWidth: 440, minHeight: 290, borderRadius: 32, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 28, marginBottom: 24, shadowColor: "#4F4439", shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  track: { width: "100%", height: 6, backgroundColor: colors.track, borderRadius: 5, overflow: "hidden", marginBottom: 28 },
  progress: { height: "100%", borderRadius: 5 },
  timerText: { fontSize: 78, fontWeight: "600", letterSpacing: -2.5, color: colors.text, fontVariant: ["tabular-nums"] },
  timerHint: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  controlsRow: { width: "100%", maxWidth: 440, flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "center" },
  mainButton: { flex: 1, minHeight: 64, paddingHorizontal: 20, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  mainButtonText: { color: "#FFFFFF", fontSize: 19, fontWeight: "700" },
  secondaryButton: { minHeight: 58, paddingHorizontal: 18, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  durationSummary: { color: colors.textMuted, fontSize: 15, marginTop: 8 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalContent: { paddingTop: 26, paddingBottom: 36, paddingHorizontal: 24 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { color: colors.text, fontSize: 28, fontWeight: "700" },
  closeText: { color: colors.textMuted, fontSize: 34, lineHeight: 38 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 18, marginBottom: 10 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 18 },
  durationInput: { minWidth: 80, paddingVertical: 14, color: colors.text, fontSize: 22, fontWeight: "700" },
  inputUnit: { color: colors.textMuted, fontSize: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", marginTop: 22, gap: 12 },
  checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.focus, borderColor: colors.focus },
  toggleLabel: { color: colors.text, fontSize: 15, flexShrink: 1 },
  optionList: { gap: 8 },
  option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.surface },
  optionSelected: { borderWidth: 1.5, borderColor: colors.focus },
  optionText: { color: colors.text, fontSize: 15 },
  optionCheck: { color: colors.focus, fontSize: 20, fontWeight: "700" },
  presetsRow: { flexDirection: "row", gap: 10 },
  languageChip: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface },
  languageChipActive: { backgroundColor: colors.buttonBg, borderColor: colors.buttonBg },
  presetChipText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  activeChipText: { color: "#FFFFFF" },
  saveButton: { minHeight: 58, justifyContent: "center", alignItems: "center", borderRadius: 20, backgroundColor: colors.focus, marginTop: 28 },
  saveButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  muted: { color: colors.textMuted },
});
