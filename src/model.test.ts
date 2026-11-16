import { expect, it } from "vitest";
import {
  emptyState,
  transition,
  remaining,
  parseState,
  formatClock,
  visibleTasks,
  type State,
} from "./model";
const now = 1_800_000_000_000;
const task = {
  id: "task",
  title: "Write tests",
  priority: "high" as const,
  done: false,
  createdAt: now,
};
const base: State = { ...emptyState(), tasks: [task] };
const start = () =>
  transition(
    base,
    {
      type: "start",
      id: "session",
      taskId: "task",
      mode: "focus",
      minutes: 25,
    },
    now,
  );
it("starts an assigned timer with a persisted deadline", () => {
  const state = start();
  expect(state.timer?.endAt).toBe(now + 25 * 60000);
  expect(state.timer?.title).toBe("Write tests");
});
it("pauses remaining time and resumes from the new clock time", () => {
  const paused = transition(start(), { type: "pause" }, now + 60000);
  expect(paused.timer?.remainingMs).toBe(24 * 60000);
  expect(remaining(paused.timer!, now + 900000)).toBe(24 * 60000);
  const resumed = transition(paused, { type: "resume" }, now + 900000);
  expect(resumed.timer?.endAt).toBe(now + 900000 + 24 * 60000);
});
it("recovers an expired timer on reload and records it exactly once", () => {
  const restored = parseState(JSON.stringify(start()));
  const finished = transition(restored, { type: "tick" }, now + 30 * 60000);
  expect(finished.timer).toBeNull();
  expect(finished.sessions).toHaveLength(1);
  expect(finished.sessions[0].completedAt).toBe(now + 25 * 60000);
  expect(
    transition(finished, { type: "tick" }, now + 60 * 60000).sessions,
  ).toHaveLength(1);
});
it("a pause at the deadline completes rather than losing the session", () => {
  expect(
    transition(start(), { type: "pause" }, now + 25 * 60000).sessions,
  ).toHaveLength(1);
});
it("cancels an unfinished session without counting it", () => {
  expect(transition(start(), { type: "cancel" }, now + 10000)).toMatchObject({
    timer: null,
    sessions: [],
  });
});
it("break completion does not inflate focus history", () => {
  const state = transition(
    base,
    { type: "start", id: "break", taskId: null, mode: "break", minutes: 5 },
    now,
  );
  expect(transition(state, { type: "tick" }, now + 300000)).toMatchObject({
    sessions: [],
    timer: null,
    lastFinished: { mode: "break" },
  });
});
it("does not allow overlapping timers or completed task starts", () => {
  expect(() =>
    transition(
      start(),
      { type: "start", id: "other", taskId: null, mode: "focus", minutes: 25 },
      now,
    ),
  ).toThrow();
  expect(() =>
    transition(
      { ...base, tasks: [{ ...task, done: true }] },
      {
        type: "start",
        id: "other",
        taskId: "task",
        mode: "focus",
        minutes: 25,
      },
      now,
    ),
  ).toThrow();
});
it("protects the active task from deletion but allows independent completion", () => {
  expect(() =>
    transition(start(), { type: "deleteTask", id: "task" }, now),
  ).toThrow();
  expect(
    transition(start(), { type: "toggleTask", id: "task" }, now).tasks[0].done,
  ).toBe(true);
});
it("supports delete and undo with duplicate protection", () => {
  const deleted = transition(base, { type: "deleteTask", id: "task" }, now);
  const restored = transition(deleted, { type: "restoreTask", task }, now);
  expect(restored.tasks).toEqual([task]);
  expect(
    transition(restored, { type: "restoreTask", task }, now).tasks,
  ).toHaveLength(1);
});
it("rejects invalid stored records without silently resetting them", () => {
  for (const raw of [
    "null",
    "{}",
    JSON.stringify({ ...base, tasks: [task, task] }),
    JSON.stringify({ ...base, timer: {} }),
  ])
    expect(() => parseState(raw)).toThrow();
});
it("filters tasks and sorts unfinished high priority first without mutation", () => {
  const tasks = [
    { ...task, id: "low", priority: "low" as const },
    task,
    { ...task, id: "done", done: true },
  ];
  expect(visibleTasks(tasks, "WRITE", "queue").map((t) => t.id)).toEqual([
    "task",
    "low",
  ]);
  expect(tasks[0].id).toBe("low");
});
it("rounds the visible clock upward and clamps at zero", () => {
  expect(formatClock(59999)).toBe("01:00");
  expect(formatClock(-1)).toBe("00:00");
});
