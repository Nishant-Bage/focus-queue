import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyState,
  parseState,
  STORAGE_KEY,
  transition,
  type Action,
  type State,
} from "../model";
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      state: raw === null ? emptyState() : parseState(raw),
      error: "",
      blocked: false,
    };
  } catch {
    return {
      state: emptyState(),
      error:
        "Saved data could not be read. It has been preserved. Export it or explicitly reset storage to continue.",
      blocked: true,
    };
  }
}
export function useFocusQueue() {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.state);
  const current = useRef(state);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [now, setNow] = useState(Date.now);
  const dispatch = useCallback(
    (action: Action) => {
      if (blocked) return false;
      try {
        const actionTime = Date.now();
        const next = transition(current.current, action, actionTime);
        if (next === current.current) return true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        current.current = next;
        setNow(actionTime);
        setState(next);
        setError("");
        return true;
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not save your change.",
        );
        return false;
      }
    },
    [blocked],
  );
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      dispatch({ type: "tick" });
    };
    tick();
    const interval = setInterval(tick, 1000);
    const visible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [dispatch]);
  useEffect(() => {
    document.title = state.timer
      ? `${state.timer.endAt === null ? "Paused" : "Focusing"} · Focus Queue`
      : "Focus Queue — One thing at a time";
  }, [state.timer?.endAt, state.timer?.id]);
  function reset() {
    try {
      const next = emptyState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setState(next);
      setBlocked(false);
      setError("");
    } catch {
      setError("Browser storage is unavailable. Reset was not applied.");
    }
  }
  function exportData() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        JSON.stringify(current.current, null, 2);
      const url = URL.createObjectURL(
        new Blob([raw], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "focus-queue-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Could not export saved data.");
    }
  }
  return { state, now, error, blocked, dispatch, reset, exportData };
}
