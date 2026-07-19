import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import { useTimer } from "../hooks/useTimer";
import { requestNotificationPermission } from "../lib/notifications";
import { loadSettings, saveSettings, appendSession } from "../lib/storage";
import {
  BREAK_PRESETS,
  DEFAULT_SETTINGS,
  FOCUS_PRESETS,
  SessionRecord,
  TimerSettings,
} from "../types";
import { colors } from "../theme";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function TimerScreen() {
  // 集中中はスリープさせず、タイマーを最後まで動かし続ける
  useKeepAwake();

  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    loadSettings().then((s) => {
      setSettings(s);
      setSettingsLoaded(true);
    });
  }, []);

  const handleSessionComplete = (record: SessionRecord) => {
    appendSession(record);
  };

  const timer = useTimer({ settings, onSessionComplete: handleSessionComplete });

  const updateSettings = async (partial: Partial<TimerSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(next);
  };

  if (!settingsLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>読み込み中...</Text>
      </View>
    );
  }

  const accentColor = timer.mode === "focus" ? colors.focus : colors.break;
  const progress = timer.totalSeconds > 0 ? 1 - timer.remainingSeconds / timer.totalSeconds : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.modeLabel, { color: accentColor }]}>
        {timer.mode === "focus" ? "集中中" : "休憩中"}
      </Text>

      <View style={styles.timerCircleOuter}>
        <View
          style={[
            styles.progressBar,
            { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: accentColor },
          ]}
        />
        <Text style={styles.timerText}>{formatTime(timer.remainingSeconds)}</Text>
      </View>

      <View style={styles.controlsRow}>
        {!timer.isRunning ? (
          <Pressable style={[styles.mainButton, { backgroundColor: accentColor }]} onPress={timer.start}>
            <Text style={styles.mainButtonText}>開始</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.mainButton, { backgroundColor: colors.buttonBg }]} onPress={timer.pause}>
            <Text style={styles.mainButtonText}>一時停止</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={timer.reset}>
          <Text style={styles.secondaryButtonText}>リセット</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={timer.skip}>
          <Text style={styles.secondaryButtonText}>スキップ</Text>
        </Pressable>
      </View>

      {!timer.isRunning && (
        <View style={styles.presetsSection}>
          <Text style={styles.presetsLabel}>集中時間(分)</Text>
          <View style={styles.presetsRow}>
            {FOCUS_PRESETS.map((min) => (
              <Pressable
                key={min}
                style={[
                  styles.presetChip,
                  settings.focusMinutes === min && { borderColor: colors.focus, borderWidth: 2 },
                ]}
                onPress={() => updateSettings({ focusMinutes: min })}
              >
                <Text style={styles.presetChipText}>{min}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.presetsLabel}>休憩時間(分)</Text>
          <View style={styles.presetsRow}>
            {BREAK_PRESETS.map((min) => (
              <Pressable
                key={min}
                style={[
                  styles.presetChip,
                  settings.breakMinutes === min && { borderColor: colors.break, borderWidth: 2 },
                ]}
                onPress={() => updateSettings({ breakMinutes: min })}
              >
                <Text style={styles.presetChipText}>{min}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.toggleRow}
            onPress={() => updateSettings({ autoStartBreak: !settings.autoStartBreak })}
          >
            <View
              style={[
                styles.checkbox,
                settings.autoStartBreak && { backgroundColor: colors.focus, borderColor: colors.focus },
              ]}
            />
            <Text style={styles.toggleLabel}>集中終了後、自動で休憩を開始する</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  muted: {
    color: colors.textMuted,
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
    letterSpacing: 2,
  },
  timerCircleOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    overflow: "hidden",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: "100%",
    opacity: 0.25,
  },
  timerText: {
    fontSize: 56,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  mainButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  mainButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  presetsSection: {
    width: "100%",
    marginTop: 8,
  },
  presetsLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 16,
  },
  presetsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetChipText: {
    color: colors.text,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    flexShrink: 1,
  },
});
