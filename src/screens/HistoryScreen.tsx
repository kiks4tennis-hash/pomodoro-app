import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { filterToday, loadSessions } from "../lib/storage";
import { SessionRecord } from "../types";
import { colors } from "../theme";

function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function HistoryScreen() {
  const [todaySessions, setTodaySessions] = useState<SessionRecord[]>([]);

  // 画面に戻ってくるたびに最新の記録を再読み込みする
  useFocusEffect(
    useCallback(() => {
      loadSessions().then((all) => setTodaySessions(filterToday(all)));
    }, [])
  );

  const completedFocusSessions = todaySessions.filter((s) => s.mode === "focus" && s.completed);
  const totalFocusMinutes = Math.round(
    completedFocusSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{completedFocusSessions.length}</Text>
          <Text style={styles.summaryLabel}>今日のセット数</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalFocusMinutes}</Text>
          <Text style={styles.summaryLabel}>集中した分数</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>本日のセッション</Text>

      <FlatList
        data={[...todaySessions].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.muted}>まだ記録がありません。</Text>}
        renderItem={({ item }) => (
          <View style={styles.sessionRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: item.mode === "focus" ? colors.focus : colors.break },
              ]}
            />
            <Text style={styles.sessionLabel}>
              {item.mode === "focus" ? "集中" : "休憩"} ・ {Math.round(item.durationSeconds / 60)}分
            </Text>
            <Text style={styles.sessionTime}>{formatClock(item.startedAt)}</Text>
            {!item.completed && <Text style={styles.skippedTag}>途中終了</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  muted: {
    color: colors.textMuted,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionLabel: {
    color: colors.text,
    flex: 1,
  },
  sessionTime: {
    color: colors.textMuted,
    fontSize: 12,
  },
  skippedTag: {
    color: colors.textMuted,
    fontSize: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
});
