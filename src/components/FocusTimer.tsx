import { useState } from "react";
import { EndSessionDialog } from "./EndSessionDialog";
import {
  formatClock,
  remaining,
  type Mode,
  type Task,
  type Timer,
  type Action,
} from "../model";
export function FocusTimer({
  timer,
  selected,
  now,
  dispatch,
  disabled,
  onClearSelection,
}: {
  timer: Timer | null;
  selected: Task | undefined;
  now: number;
  dispatch: (action: Action) => boolean;
  disabled: boolean;
  onClearSelection: () => void;
}) {
  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const effectiveMode = timer?.mode ?? mode;
  const duration =
    timer?.durationMs ?? (mode === "focus" ? focusMinutes : 5) * 60000;
  const left = timer ? remaining(timer, now) : duration;
  const progress = Math.min(
    100,
    Math.max(0, ((duration - left) / duration) * 100),
  );
  return (
    <section
      className="panel timer-panel"
      id="focus"
      aria-labelledby="timer-heading"
    >
      <div className="timer-top">
        <span className="eyebrow">YOUR TIME, INTENTIONALLY</span>
        <span className="timer-spark" aria-hidden="true">
          ✦
        </span>
      </div>
      <h2 id="timer-heading">A little room to focus.</h2>
      <div className="timer-modes" aria-label="Timer mode">
        <button
          disabled={!!timer}
          aria-pressed={effectiveMode === "focus"}
          className={effectiveMode === "focus" ? "active" : ""}
          onClick={() => setMode("focus")}
        >
          Focus
        </button>
        <button
          disabled={!!timer}
          aria-pressed={effectiveMode === "break"}
          className={effectiveMode === "break" ? "active" : ""}
          onClick={() => setMode("break")}
        >
          Short break
        </button>
      </div>
      <div
        className="timer-ring"
        style={{ "--progress": `${progress}%` } as React.CSSProperties}
      >
        <div>
          <span className="timer-state">
            {timer
              ? timer.endAt === null
                ? "PAUSED"
                : "IN PROGRESS"
              : effectiveMode === "break"
                ? "TAKE A BREATHER"
                : "READY WHEN YOU ARE"}
          </span>
          <time className="clock" aria-label={`${formatClock(left)} remaining`}>
            {formatClock(left)}
          </time>
          <span className="timer-caption">
            {effectiveMode === "focus"
              ? "One thing at a time."
              : "Rest is part of the work."}
          </span>
        </div>
      </div>
      <div className="focus-target">
        <span className="eyebrow">
          {effectiveMode === "break" ? "A MOMENT FOR YOU" : "FOCUSING ON"}
        </span>
        <p>
          {timer?.title ??
            (mode === "break"
              ? "Step away. Stretch. Reset."
              : (selected?.title ?? "Open focus — no task selected"))}
        </p>
        {!timer && selected && mode === "focus" && (
          <button className="quiet" onClick={onClearSelection}>
            Clear task
          </button>
        )}
      </div>
      {!timer && mode === "focus" && (
        <label className="duration">
          Session length
          <select
            value={focusMinutes}
            onChange={(e) => setFocusMinutes(Number(e.target.value))}
          >
            <option value={15}>15 minutes</option>
            <option value={25}>25 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </label>
      )}
      <div className="timer-controls">
        {!timer ? (
          <button
            className="primary start"
            disabled={disabled}
            onClick={() => {
              setConfirmEnd(false);
              dispatch({
                type: "start",
                id: crypto.randomUUID(),
                taskId: mode === "focus" ? (selected?.id ?? null) : null,
                mode,
                minutes: mode === "focus" ? focusMinutes : 5,
              });
            }}
          >
            ▶ Start {mode === "focus" ? "focus" : "break"}
          </button>
        ) : (
          <>
            <button
              className="primary start"
              disabled={disabled}
              onClick={() =>
                dispatch({ type: timer.endAt === null ? "resume" : "pause" })
              }
            >
              {timer.endAt === null ? "▶ Resume" : "Ⅱ Pause"}
            </button>
            <button
              className="quiet"
              disabled={disabled}
              onClick={() => setConfirmEnd(true)}
            >
              End session
            </button>
          </>
        )}
      </div>
      {confirmEnd && timer && (
        <EndSessionDialog
          onEnd={() => {
            if (dispatch({ type: "cancel" })) setConfirmEnd(false);
          }}
          onClose={() => setConfirmEnd(false)}
        />
      )}
      <p className="timer-note">
        {timer
          ? "Safe to refresh. Your timer remembers where you are."
          : "No rush. Just a little progress."}
      </p>
    </section>
  );
}
