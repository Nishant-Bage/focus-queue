export type Priority = "high" | "medium" | "low";
export type Task = {
  id: string;
  title: string;
  priority: Priority;
  done: boolean;
  createdAt: number;
};
export type Mode = "focus" | "break";
export type Timer = {
  id: string;
  taskId: string | null;
  title: string;
  mode: Mode;
  durationMs: number;
  remainingMs: number;
  endAt: number | null;
  startedAt: number;
};
export type Session = {
  id: string;
  taskId: string | null;
  title: string;
  durationMs: number;
  completedAt: number;
};
export type State = {
  version: 1;
  tasks: Task[];
  sessions: Session[];
  timer: Timer | null;
  lastFinished: {
    id: string;
    mode: Mode;
    title: string;
    completedAt: number;
  } | null;
};
export const STORAGE_KEY = "focus-queue:v1";
export const emptyState = (): State => ({
  version: 1,
  tasks: [],
  sessions: [],
  timer: null,
  lastFinished: null,
});
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 160;
const unique = (rows: { id: string }[]) =>
  new Set(rows.map((row) => row.id)).size === rows.length;
export function parseState(raw: string): State {
  const value = JSON.parse(raw) as State;
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.sessions) ||
    value.tasks.length > 1000 ||
    value.sessions.length > 500
  )
    throw new Error("Unsupported saved data.");
  for (const task of value.tasks)
    if (
      !task ||
      !text(task.id) ||
      !text(task.title) ||
      !["high", "medium", "low"].includes(task.priority) ||
      typeof task.done !== "boolean" ||
      !finite(task.createdAt)
    )
      throw new Error("Invalid saved task.");
  for (const session of value.sessions)
    if (
      !session ||
      !text(session.id) ||
      !text(session.title) ||
      !(session.taskId === null || text(session.taskId)) ||
      !finite(session.durationMs) ||
      session.durationMs < 60000 ||
      session.durationMs > 5400000 ||
      !finite(session.completedAt)
    )
      throw new Error("Invalid saved session.");
  if (!unique(value.tasks) || !unique(value.sessions))
    throw new Error("Duplicate saved records.");
  const timer = value.timer;
  if (
    timer !== null &&
    (!timer ||
      !text(timer.id) ||
      !text(timer.title) ||
      !(timer.taskId === null || text(timer.taskId)) ||
      !["focus", "break"].includes(timer.mode) ||
      !finite(timer.durationMs) ||
      timer.durationMs < 60000 ||
      timer.durationMs > 5400000 ||
      !finite(timer.remainingMs) ||
      timer.remainingMs > timer.durationMs ||
      !finite(timer.startedAt) ||
      !(timer.endAt === null || finite(timer.endAt)))
  )
    throw new Error("Invalid saved timer.");
  const last = value.lastFinished;
  if (
    last !== null &&
    (!last ||
      !text(last.id) ||
      !text(last.title) ||
      !["focus", "break"].includes(last.mode) ||
      !finite(last.completedAt))
  )
    throw new Error("Invalid completion record.");
  return value;
}
export function remaining(timer: Timer, now: number) {
  return timer.endAt === null
    ? timer.remainingMs
    : Math.max(0, timer.endAt - now);
}
export function completeDue(state: State, now: number): State {
  const timer = state.timer;
  if (!timer || timer.endAt === null || now < timer.endAt) return state;
  const completedAt = timer.endAt;
  const session: Session = {
    id: timer.id,
    taskId: timer.taskId,
    title: timer.title,
    durationMs: timer.durationMs,
    completedAt,
  };
  const sessions =
    timer.mode === "focus" && !state.sessions.some((row) => row.id === timer.id)
      ? [session, ...state.sessions].slice(0, 500)
      : state.sessions;
  return {
    ...state,
    timer: null,
    sessions,
    lastFinished: {
      id: timer.id,
      mode: timer.mode,
      title: timer.title,
      completedAt,
    },
  };
}
export type Action =
  | { type: "saveTask"; task: Task }
  | { type: "toggleTask"; id: string }
  | { type: "deleteTask"; id: string }
  | { type: "restoreTask"; task: Task }
  | {
      type: "start";
      id: string;
      taskId: string | null;
      mode: Mode;
      minutes: number;
    }
  | { type: "pause" | "resume" | "cancel" | "tick" };
export function transition(input: State, action: Action, now: number): State {
  const state = completeDue(input, now);
  switch (action.type) {
    case "tick":
      return state;
    case "saveTask": {
      if (
        !text(action.task.title) ||
        !["high", "medium", "low"].includes(action.task.priority)
      )
        throw new Error("Enter a task name and priority.");
      const exists = state.tasks.some((t) => t.id === action.task.id);
      if (!exists && state.tasks.length >= 1000)
        throw new Error(
          "Your queue is full. Delete some completed tasks first.",
        );
      return {
        ...state,
        tasks: exists
          ? state.tasks.map((t) =>
              t.id === action.task.id
                ? { ...action.task, title: action.task.title.trim() }
                : t,
            )
          : [
              ...state.tasks,
              { ...action.task, title: action.task.title.trim() },
            ],
      };
    }
    case "toggleTask":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };
    case "deleteTask":
      if (state.timer?.taskId === action.id)
        throw new Error(
          "Finish or end the current session before deleting its task.",
        );
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "restoreTask":
      if (state.tasks.some((t) => t.id === action.task.id)) return state;
      if (state.tasks.length >= 1000) throw new Error("Your queue is full.");
      return { ...state, tasks: [...state.tasks, action.task] };
    case "start": {
      if (state.timer)
        throw new Error("Finish or end the current session first.");
      if (
        !Number.isInteger(action.minutes) ||
        action.minutes < 1 ||
        action.minutes > 90
      )
        throw new Error("Choose a duration between 1 and 90 minutes.");
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (action.taskId && (!task || task.done))
        throw new Error("Choose an unfinished task.");
      const durationMs = action.minutes * 60000;
      return {
        ...state,
        lastFinished: null,
        timer: {
          id: action.id,
          taskId: action.mode === "focus" ? action.taskId : null,
          title:
            action.mode === "break"
              ? "Short break"
              : (task?.title ?? "Open focus"),
          mode: action.mode,
          durationMs,
          remainingMs: durationMs,
          endAt: now + durationMs,
          startedAt: now,
        },
      };
    }
    case "pause":
      return state.timer && state.timer.endAt !== null
        ? {
            ...state,
            timer: {
              ...state.timer,
              remainingMs: remaining(state.timer, now),
              endAt: null,
            },
          }
        : state;
    case "resume":
      return state.timer && state.timer.endAt === null
        ? {
            ...state,
            timer: { ...state.timer, endAt: now + state.timer.remainingMs },
          }
        : state;
    case "cancel":
      return { ...state, timer: null };
  }
}
export const localDay = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
export function formatClock(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function visibleTasks(tasks: Task[], query: string, filter: string) {
  const ranks = { high: 0, medium: 1, low: 2 };
  return tasks
    .filter(
      (t) =>
        (filter === "all" || (filter === "done" ? t.done : !t.done)) &&
        t.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        ranks[a.priority] - ranks[b.priority] ||
        a.createdAt - b.createdAt,
    );
}
