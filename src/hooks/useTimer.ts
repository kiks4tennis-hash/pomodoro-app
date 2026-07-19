import { useCallback, useEffect, useRef, useState } from "react";
import { SessionRecord, TimerMode, TimerSettings } from "../types";
import { sendTimerEndNotification } from "../lib/notifications";

interface UseTimerArgs {
  settings: TimerSettings;
  onSessionComplete: (record: SessionRecord) => void;
}

function minutesToSeconds(min: number): number {
  return Math.round(min * 60);
}

function modeDurationSeconds(mode: TimerMode, settings: TimerSettings): number {
  return mode === "focus"
    ? minutesToSeconds(settings.focusMinutes)
    : minutesToSeconds(settings.breakMinutes);
}

export function useTimer({ settings, onSessionComplete }: UseTimerArgs) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [totalSeconds, setTotalSeconds] = useState(() => modeDurationSeconds("focus", settings));
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // ウォールクロック基準で終了予定時刻を保持する。
  // setIntervalのtickカウントに依存すると、バックグラウンド中にJSが
  // 停止した際に大きくズレるため、常に「終了予定時刻 - 現在時刻」で
  // 残り時間を再計算する。
  const endTimeRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 設定が変わったら、タイマーが停止中の場合のみ長さを反映する
  useEffect(() => {
    if (!isRunning) {
      const duration = modeDurationSeconds(mode, settings);
      setTotalSeconds(duration);
      setRemainingSeconds(duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, mode]);

  const finishSession = useCallback(
    (completed: boolean) => {
      clearTick();
      setIsRunning(false);

      const startedAt = startedAtRef.current ?? Date.now();
      const endedAt = Date.now();

      const record: SessionRecord = {
        id: `${startedAt}-${mode}`,
        mode,
        startedAt,
        endedAt,
        durationSeconds: totalSeconds - remainingSeconds,
        completed,
      };
      onSessionComplete(record);

      if (completed) {
        sendTimerEndNotification(mode);
      }

      const nextMode: TimerMode = mode === "focus" ? "break" : "focus";
      const nextDuration = modeDurationSeconds(nextMode, settings);
      setMode(nextMode);
      setTotalSeconds(nextDuration);
      setRemainingSeconds(nextDuration);
      endTimeRef.current = null;
      startedAtRef.current = null;

      // 集中セッションが完了した後だけ、設定に応じて休憩を自動開始する
      if (completed && mode === "focus" && settings.autoStartBreak) {
        startInternal(nextDuration);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, totalSeconds, remainingSeconds, settings, onSessionComplete]
  );

  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const remainingMs = endTimeRef.current - Date.now();
    const nextRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
    setRemainingSeconds(nextRemaining);

    if (remainingMs <= 0) {
      finishSession(true);
    }
  }, [finishSession]);

  const startInternal = (secondsOverride?: number) => {
    const seconds = secondsOverride ?? remainingSeconds;
    endTimeRef.current = Date.now() + seconds * 1000;
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
    setIsRunning(true);
    clearTick();
    intervalRef.current = setInterval(tick, 250);
  };

  const start = useCallback(() => {
    if (isRunning) return;
    startInternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, remainingSeconds]);

  const pause = useCallback(() => {
    clearTick();
    setIsRunning(false);
    endTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTick();
    setIsRunning(false);
    endTimeRef.current = null;
    startedAtRef.current = null;
    const duration = modeDurationSeconds(mode, settings);
    setTotalSeconds(duration);
    setRemainingSeconds(duration);
  }, [mode, settings]);

  // ユーザーが手動で「スキップ」した場合は completed=false として記録する
  const skip = useCallback(() => {
    finishSession(false);
  }, [finishSession]);

  useEffect(() => {
    return () => clearTick();
  }, []);

  return {
    mode,
    totalSeconds,
    remainingSeconds,
    isRunning,
    start,
    pause,
    reset,
    skip,
  };
}
