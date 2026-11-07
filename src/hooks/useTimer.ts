import { useCallback, useEffect, useRef, useState } from "react";
import { AppLanguage, SessionRecord, TimerMode, TimerSettings } from "../types";
import { cancelTimerEndNotification, scheduleTimerEndNotification } from "../lib/notifications";
import { endFocusActivity, updateFocusActivity } from "../lib/liveActivity";

interface UseTimerArgs {
  settings: TimerSettings;
  language: AppLanguage;
  onSessionComplete: (record: SessionRecord) => void;
}

function minutesToSeconds(min: number): number { return Math.round(min * 60); }
function modeDurationSeconds(mode: TimerMode, settings: TimerSettings): number {
  return mode === "focus" ? minutesToSeconds(settings.focusMinutes) : minutesToSeconds(settings.breakMinutes);
}

export function useTimer({ settings, language, onSessionComplete }: UseTimerArgs) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [totalSeconds, setTotalSeconds] = useState(() => modeDurationSeconds("focus", settings));
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const tickRef = useRef<() => void>(() => undefined);

  const clearTick = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);
  const cancelNotification = useCallback(() => {
    const id = notificationIdRef.current;
    notificationIdRef.current = null;
    void cancelTimerEndNotification(id);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      const duration = modeDurationSeconds(mode, settings);
      setTotalSeconds(duration);
      setRemainingSeconds(duration);
    }
  }, [isRunning, mode, settings]);

  const startInternal = useCallback((seconds: number, requestedMode: TimerMode = mode) => {
    const now = Date.now();
    const endAt = now + seconds * 1000;
    endTimeRef.current = endAt;
    if (!startedAtRef.current) startedAtRef.current = now;
    setIsRunning(true);
    clearTick();
    intervalRef.current = setInterval(() => tickRef.current(), 250);
    cancelNotification();
    void scheduleTimerEndNotification(requestedMode, endAt, language, settings.sound).then((id) => {
      notificationIdRef.current = id;
      if (!endTimeRef.current || endTimeRef.current !== endAt) void cancelTimerEndNotification(id);
    });
    void updateFocusActivity({ mode: requestedMode, startAt: now, endAt, remainingSeconds: seconds, language, paused: false });
  }, [cancelNotification, clearTick, language, mode, settings.sound]);

  const finishSession = useCallback((completed: boolean) => {
    clearTick();
    cancelNotification();
    setIsRunning(false);
    const startedAt = startedAtRef.current ?? Date.now();
    const endedAt = Date.now();
    const autoStartBreak = completed && mode === "focus" && settings.autoStartBreak;
    onSessionComplete({
      id: `${startedAt}-${mode}`,
      mode,
      startedAt,
      endedAt,
      durationSeconds: completed ? totalSeconds : Math.max(0, totalSeconds - remainingSeconds),
      completed,
    });
    if (!autoStartBreak) void endFocusActivity();

    const nextMode: TimerMode = mode === "focus" ? "break" : "focus";
    const nextDuration = modeDurationSeconds(nextMode, settings);
    setMode(nextMode);
    setTotalSeconds(nextDuration);
    setRemainingSeconds(nextDuration);
    endTimeRef.current = null;
    startedAtRef.current = null;
    if (autoStartBreak) {
      startInternal(nextDuration, nextMode);
    }
  }, [cancelNotification, clearTick, mode, onSessionComplete, remainingSeconds, settings, startInternal, totalSeconds]);

  const tick = useCallback(() => {
    if (endTimeRef.current === null) return;
    const remainingMs = endTimeRef.current - Date.now();
    const nextRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
    setRemainingSeconds(nextRemaining);
    if (remainingMs <= 0) finishSession(true);
  }, [finishSession]);
  tickRef.current = tick;

  const start = useCallback(() => {
    if (!isRunning) startInternal(remainingSeconds);
  }, [isRunning, remainingSeconds, startInternal]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    const remaining = Math.max(0, Math.ceil(((endTimeRef.current ?? Date.now()) - Date.now()) / 1000));
    clearTick();
    cancelNotification();
    setRemainingSeconds(remaining);
    setIsRunning(false);
    endTimeRef.current = null;
    void updateFocusActivity({ mode, startAt: startedAtRef.current ?? Date.now(), endAt: Date.now() + remaining * 1000, remainingSeconds: remaining, language, paused: true });
  }, [cancelNotification, clearTick, isRunning, language, mode]);

  const reset = useCallback(() => {
    clearTick();
    cancelNotification();
    setIsRunning(false);
    endTimeRef.current = null;
    startedAtRef.current = null;
    void endFocusActivity();
    const duration = modeDurationSeconds(mode, settings);
    setTotalSeconds(duration);
    setRemainingSeconds(duration);
  }, [cancelNotification, clearTick, mode, settings]);

  const skip = useCallback(() => finishSession(false), [finishSession]);

  useEffect(() => () => {
    clearTick();
    cancelNotification();
  }, [cancelNotification, clearTick]);

  return { mode, totalSeconds, remainingSeconds, isRunning, start, pause, reset, skip };
}
