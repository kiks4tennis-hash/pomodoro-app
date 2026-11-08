import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { loadSessions } from "../lib/storage";
import { AppLanguage, SessionRecord } from "../types";
import { colors } from "../theme";
import { t } from "../i18n";

type Period = "today" | "week";
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function formatClock(epochMs: number): string {
  const date = new Date(epochMs);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export default function HistoryScreen({ language }: { language: AppLanguage }) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [period, setPeriod] = useState<Period>("today");
  const text = t(language);
  useFocusEffect(useCallback(() => {
    let active = true;
    loadSessions().then((all) => { if (active) setSessions(all); });
    return () => { active = false; };
  }, []));

  const now = new Date();
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const todaySessions = sessions.filter((session) => session.startedAt >= today.getTime());
  const weeklySessions = sessions.filter((session) => session.startedAt >= weekStart.getTime() && session.startedAt < today.getTime() + 86400000);
  const shownSessions = period === "today" ? todaySessions : weeklySessions;
  const focusSessions = shownSessions.filter((session) => session.mode === "focus" && session.completed);
  const focusMinutes = Math.round(focusSessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const seconds = weeklySessions.filter((session) => session.mode === "focus" && session.completed && dateKey(new Date(session.startedAt)) === dateKey(day)).reduce((sum, session) => sum + session.durationSeconds, 0);
    return { date: day, minutes: Math.round(seconds / 60), label: text[DAY_KEYS[day.getDay()]] };
  }), [weekStart.getTime(), weeklySessions, text]);
  const maxMinutes = Math.max(25, ...weekDays.map((day) => day.minutes));
  const activeDays = weekDays.filter((day) => day.minutes > 0).length;
  const bestDay = weekDays.reduce<(typeof weekDays)[number] | null>((best, day) => !best || day.minutes > best.minutes ? day : best, null);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{language === "ja" ? "記録を振り返る" : "YOUR PROGRESS"}</Text>
        <Text style={styles.title}>{period === "today" ? text.today : text.weeklyTitle}</Text>
      </View>

      <View style={styles.segment}>
        {(["today", "week"] as const).map((item) => (
          <Pressable key={item} style={[styles.segmentItem, period === item && styles.segmentItemActive]} onPress={() => setPeriod(item)}>
            <Text style={[styles.segmentText, period === item && styles.segmentTextActive]}>{item === "today" ? text.today : text.week}</Text>
          </Pressable>
        ))}
      </View>

      {period === "week" && (
        <View style={styles.weekCard}>
          <Text style={styles.cardTitle}>{text.weeklyTitle}</Text>
          <Text style={styles.dateRange}>{weekStart.toLocaleDateString(language, { month: "short", day: "numeric" })} – {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString(language, { month: "short", day: "numeric" })}</Text>
          <View style={styles.chart}>
            {weekDays.map((day) => (
              <View key={dateKey(day.date)} style={styles.chartColumn}>
                <Text style={styles.barValue}>{day.minutes > 0 ? day.minutes : ""}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${Math.max(day.minutes > 0 ? 8 : 0, (day.minutes / maxMinutes) * 100)}%` }]} />
                </View>
                <Text style={styles.dayLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}><Text style={styles.statValue}>{Math.round(focusMinutes / 7)}</Text><Text style={styles.statLabel}>{text.dailyAverage}</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{activeDays}<Text style={styles.statSuffix}> / 7</Text></Text><Text style={styles.statLabel}>{text.activeDays}</Text></View>
            <View style={styles.statBox}><Text style={styles.statValueSmall}>{bestDay?.minutes ? `${bestDay.label} ${bestDay.minutes}` : "—"}</Text><Text style={styles.statLabel}>{text.bestDay}</Text></View>
          </View>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}><Text style={styles.summaryValue}>{focusSessions.length}</Text><Text style={styles.summaryLabel}>{text.focusSets}</Text></View>
        <View style={styles.summaryCard}><Text style={styles.summaryValue}>{focusMinutes}</Text><Text style={styles.summaryLabel}>{text.focusMinutes}</Text></View>
      </View>

      <Text style={styles.sectionTitle}>{period === "today" ? text.todaySessions : text.weeklySessions}</Text>
      {shownSessions.length === 0 ? <Text style={styles.empty}>{text.noSessions}</Text> : [...shownSessions].reverse().map((item) => (
        <View key={item.id} style={styles.sessionRow}>
          <View style={[styles.dot, { backgroundColor: item.mode === "focus" ? colors.focus : colors.break }]} />
          <Text style={styles.sessionLabel}>{item.mode === "focus" ? text.focus : text.rest} · {Math.round(item.durationSeconds / 60)} {text.min}</Text>
          <Text style={styles.sessionTime}>{period === "week" ? `${new Date(item.startedAt).toLocaleDateString(language, { month: "numeric", day: "numeric" })} ` : ""}{formatClock(item.startedAt)}</Text>
          {!item.completed && <Text style={styles.skippedTag}>{text.skipped}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", paddingTop: 28, paddingBottom: 124, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 22 },
  eyebrow: { color: colors.textMuted, fontSize: 12, letterSpacing: 2.5, fontWeight: "700", marginBottom: 7 },
  title: { color: colors.text, fontSize: 32, fontWeight: "700" },
  segment: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: 18, padding: 5, marginBottom: 20 },
  segmentItem: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  segmentItemActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.textMuted, fontWeight: "600", fontSize: 15 },
  segmentTextActive: { color: colors.text },
  weekCard: { backgroundColor: colors.surface, borderRadius: 26, padding: 20, marginBottom: 18 },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 18 },
  dateRange: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
  chart: { height: 158, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22, marginBottom: 20, gap: 10 },
  chartColumn: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" },
  barValue: { height: 20, color: colors.textMuted, fontSize: 11 },
  barTrack: { width: "100%", flex: 1, backgroundColor: colors.track, borderRadius: 10, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", minHeight: 0, backgroundColor: colors.focus, borderRadius: 10 },
  dayLabel: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, borderColor: colors.border, paddingTop: 15, gap: 8 },
  statBox: { flex: 1 },
  statValue: { color: colors.text, fontSize: 21, fontWeight: "700" },
  statValueSmall: { color: colors.text, fontSize: 16, fontWeight: "700" },
  statSuffix: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  summaryRow: { flexDirection: "row", gap: 14, marginBottom: 26 },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 22, paddingVertical: 21, paddingHorizontal: 17 },
  summaryValue: { fontSize: 34, fontWeight: "700", color: colors.text },
  summaryLabel: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 12 },
  empty: { color: colors.textMuted, paddingVertical: 20, fontSize: 15 },
  sessionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  sessionLabel: { color: colors.text, flex: 1, fontSize: 15 },
  sessionTime: { color: colors.textMuted, fontSize: 13 },
  skippedTag: { color: colors.textMuted, fontSize: 11, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
});
