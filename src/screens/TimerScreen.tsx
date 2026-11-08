import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
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
  const [focusPresetInputs, setFocusPresetInputs] = useState(DEFAULT_SETTINGS.focusPresets.map(String));
  const [breakPresetInputs, setBreakPresetInputs] = useState(DEFAULT_SETTINGS.breakPresets.map(String));
  const bellPlayer = useAudioPlayer(require("../../assets/sounds/gentle-bell.wav"));
  const waterPlayer = useAudioPlayer(require("../../assets/sounds/water-sound.wav"));
  const warmPlayer = useAudioPlayer(require("../../assets/sounds/warm-tone.wav"));

  useEffect(() => {
    loadSettings(Localization.getLocales()[0]?.languageCode).then((saved) => {
      setSettings(saved);
      setFocusPresetInputs(saved.focusPresets.map(String));
      setBreakPresetInputs(saved.breakPresets.map(String));
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
    { value: "water-sound.wav", label: text.soundWater },
    { value: "warm-tone.wav", label: text.soundWarm },
  ];

  const previewSound = async (sound: TimerSound) => {
    const players = { "gentle-bell.wav": bellPlayer, "water-sound.wav": waterPlayer, "warm-tone.wav": warmPlayer };
    const player = players[sound];
    const allPlayers = [bellPlayer, waterPlayer, warmPlayer];
    allPlayers.forEach((item) => item.pause());
    await setAudioModeAsync({ playsInSilentMode: true });
    await player.seekTo(0);
    player.play();
  };

  const savePresets = () => {
    const focusPresets = focusPresetInputs.map((value) => Number(value.trim()));
    const breakPresets = breakPresetInputs.map((value) => Number(value.trim()));
    if (focusPresets.length !== settings.focusPresets.length || focusPresets.some((value) => !Number.isInteger(value) || value < 1 || value > 180)) {
      Alert.alert(text.settings, text.validFocus);
      return;
    }
    if (breakPresets.length !== settings.breakPresets.length || breakPresets.some((value) => !Number.isInteger(value) || value < 1 || value > 60)) {
      Alert.alert(text.settings, text.validBreak);
      return;
    }
    const focusMinutes = settings.focusPresets.includes(settings.focusMinutes)
      ? focusPresets[settings.focusPresets.indexOf(settings.focusMinutes)]
      : settings.focusMinutes;
    const breakMinutes = settings.breakPresets.includes(settings.breakMinutes)
      ? breakPresets[settings.breakPresets.indexOf(settings.breakMinutes)]
      : settings.breakMinutes;
    void updateSettings({ focusMinutes, breakMinutes, focusPresets, breakPresets });
    setSettingsVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>FOCUS TIMER</Text><Text style={[styles.modeLabel, { color: accent }]}>{timer.mode === "focus" ? text.focus : text.rest}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={text.settings} style={styles.settingsButton} onPress={() => {
          setFocusPresetInputs(settings.focusPresets.map(String));
          setBreakPresetInputs(settings.breakPresets.map(String));
          setSettingsVisible(true);
        }}><Text style={styles.settingsButtonText}>⚙</Text></Pressable>
      </View>

      <View style={styles.timerCard}>
        <View style={styles.track} accessibilityLabel={`${Math.round(progress * 100)}%`}>
          <View style={[styles.progress, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: accent }]} />
        </View>
        <Text style={styles.timerText}>{formatTime(timer.remainingSeconds)}</Text>
        <Text style={styles.timerHint}>{timer.isRunning ? (language === "ja" ? "いいペースです" : "You're doing great") : (language === "ja" ? "自分のペースで" : "At your own pace")}</Text>
      </View>

      <View style={styles.presetSection}>
        <Text style={styles.presetLabel}>{text.focusLength}</Text>
        <View style={styles.presetsRow}>{settings.focusPresets.map((minutes, index) => <Pressable key={`focus-${index}`} accessibilityRole="button" style={[styles.timerPreset, timer.mode === "focus" && settings.focusMinutes === minutes && styles.timerPresetActive]} onPress={() => void updateSettings({ focusMinutes: minutes })}><Text style={[styles.timerPresetText, timer.mode === "focus" && settings.focusMinutes === minutes && styles.activeChipText]}>{minutes}{text.min}</Text></Pressable>)}</View>
        <Text style={styles.presetLabel}>{text.breakLength}</Text>
        <View style={styles.presetsRow}>{settings.breakPresets.map((minutes, index) => <Pressable key={`break-${index}`} accessibilityRole="button" style={[styles.timerPreset, timer.mode === "break" && settings.breakMinutes === minutes && styles.timerPresetActive]} onPress={() => void updateSettings({ breakMinutes: minutes })}><Text style={[styles.timerPresetText, timer.mode === "break" && settings.breakMinutes === minutes && styles.activeChipText]}>{minutes}{text.min}</Text></Pressable>)}</View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable accessibilityRole="button" style={[styles.controlButton, styles.mainButton, { backgroundColor: timer.isRunning ? colors.buttonBg : accent }]} onPress={timer.isRunning ? timer.pause : timer.start}>
          <Text style={styles.mainButtonText}>{timer.isRunning ? text.pause : text.start}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={[styles.controlButton, styles.secondaryButton]} onPress={timer.reset}><Text style={styles.secondaryButtonText}>{text.reset}</Text></Pressable>
        <Pressable accessibilityRole="button" style={[styles.controlButton, styles.secondaryButton]} onPress={timer.skip}><Text style={styles.secondaryButtonText}>{text.skip}</Text></Pressable>
      </View>
      <Text style={styles.durationSummary}>
        {language === "ja"
          ? `集中時間：${settings.focusMinutes}${text.min} · 休憩時間：${settings.breakMinutes}${text.min}`
          : `Focus: ${settings.focusMinutes} ${text.min} · Break: ${settings.breakMinutes} ${text.min}`}
      </Text>

      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsVisible(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{text.settings}</Text><Pressable accessibilityRole="button" accessibilityLabel={text.reset} onPress={() => setSettingsVisible(false)}><Text style={styles.closeText}>×</Text></Pressable></View>
            <Text style={styles.sectionTitle}>{text.focusPresets}</Text>
            <View style={styles.editPresetsRow}>{focusPresetInputs.map((value, index) => <TextInput key={`focus-edit-${index}`} accessibilityLabel={`${text.focusPresets} ${index + 1}`} value={value} onChangeText={(next) => setFocusPresetInputs((values) => values.map((item, i) => i === index ? next : item))} keyboardType="number-pad" style={styles.presetInput} maxLength={3} />)}</View>
            <Text style={styles.sectionTitle}>{text.breakPresets}</Text>
            <View style={styles.editPresetsRow}>{breakPresetInputs.map((value, index) => <TextInput key={`break-edit-${index}`} accessibilityLabel={`${text.breakPresets} ${index + 1}`} value={value} onChangeText={(next) => setBreakPresetInputs((values) => values.map((item, i) => i === index ? next : item))} keyboardType="number-pad" style={styles.presetInput} maxLength={2} />)}</View>
            <Pressable style={styles.toggleRow} onPress={() => void updateSettings({ autoStartBreak: !settings.autoStartBreak })}><View style={[styles.checkbox, settings.autoStartBreak && styles.checkboxActive]} /><Text style={styles.toggleLabel}>{text.autoBreak}</Text></Pressable>
            <Text style={styles.sectionTitle}>{text.sound}</Text>
            <View style={styles.optionList}>{soundOptions.map((option) => <Pressable key={option.value} style={[styles.option, settings.sound === option.value && styles.optionSelected]} onPress={() => { void previewSound(option.value); void updateSettings({ sound: option.value }); }}><Text style={styles.optionText}>{option.label}</Text><Text style={styles.optionCheck}>{settings.sound === option.value ? "✓" : "▶"}</Text></Pressable>)}</View>
            <Text style={styles.sectionTitle}>{text.language}</Text>
            <View style={styles.presetsRow}>{([{ value: "ja", label: text.japanese }, { value: "en", label: text.english }] as const).map((option) => <Pressable key={option.value} style={[styles.languageChip, settings.language === option.value && styles.languageChipActive]} onPress={() => void updateSettings({ language: option.value })}><Text style={[styles.presetChipText, settings.language === option.value && styles.activeChipText]}>{option.label}</Text></Pressable>)}</View>
            <Pressable style={styles.saveButton} onPress={savePresets}><Text style={styles.saveButtonText}>{text.save}</Text></Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", backgroundColor: colors.background, alignItems: "center", paddingTop: 20, paddingBottom: 124, paddingHorizontal: 24 },
  header: { width: "100%", maxWidth: 440, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  eyebrow: { color: colors.textMuted, fontSize: 12, letterSpacing: 2.4, fontWeight: "700", marginBottom: 6 },
  modeLabel: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2 },
  settingsButton: { width: 50, height: 50, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  settingsButtonText: { color: colors.text, fontSize: 25, fontWeight: "500" },
  timerCard: { width: "100%", maxWidth: 440, height: 340, borderRadius: 32, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 28, marginBottom: 16, shadowColor: "#4F4439", shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  track: { width: "100%", height: 6, backgroundColor: colors.track, borderRadius: 5, overflow: "hidden", marginBottom: 28 },
  progress: { height: "100%", borderRadius: 5 },
  timerText: { fontSize: 70, fontWeight: "600", letterSpacing: -2.5, color: colors.text, fontVariant: ["tabular-nums"] },
  timerHint: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  controlsRow: { width: "100%", maxWidth: 440, flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "center" },
  controlButton: { flex: 1, height: 62, paddingHorizontal: 6, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  mainButton: {},
  mainButtonText: { color: "#FFFFFF", fontSize: 19, fontWeight: "700" },
  secondaryButton: { backgroundColor: colors.surface },
  secondaryButtonText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  durationSummary: { width: "100%", maxWidth: 440, color: colors.textMuted, fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 8, marginBottom: 8 },
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
  presetSection: { width: "100%", maxWidth: 440, gap: 8, marginBottom: 16 },
  presetLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginTop: 2 },
  timerPreset: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface },
  timerPresetActive: { backgroundColor: colors.buttonBg, borderColor: colors.buttonBg },
  timerPresetText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  editPresetsRow: { flexDirection: "row", gap: 8 },
  presetInput: { flex: 1, minWidth: 0, textAlign: "center", paddingVertical: 12, color: colors.text, fontSize: 19, fontWeight: "700", backgroundColor: colors.surface, borderRadius: 14 },
  languageChip: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface },
  languageChipActive: { backgroundColor: colors.buttonBg, borderColor: colors.buttonBg },
  presetChipText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  activeChipText: { color: "#FFFFFF" },
  saveButton: { minHeight: 58, justifyContent: "center", alignItems: "center", borderRadius: 20, backgroundColor: colors.focus, marginTop: 28 },
  saveButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  muted: { color: colors.textMuted },
});
