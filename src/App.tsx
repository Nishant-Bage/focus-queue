import { useState } from "react";
import { useFocusQueue } from "./hooks/useFocusQueue";
import { localDay, type Task } from "./model";
import { TaskList } from "./components/TaskList";
import { FocusTimer } from "./components/FocusTimer";
import { SessionHistory } from "./components/SessionHistory";
export default function App() {
  const { state, now, error, blocked, dispatch, reset, exportData } =
    useFocusQueue();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Task | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const selected = state.tasks.find(
    (task) => task.id === selectedId && !task.done,
  );
  const todays = state.sessions.filter(
    (s) => localDay(s.completedAt) === localDay(now),
  );
  const minutes = todays.reduce((sum, s) => sum + s.durationMs / 60000, 0);
  const pending = state.tasks.filter((t) => !t.done);
  const activeId = state.timer?.taskId ?? selected?.id ?? null;
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to workspace
      </a>
      <aside>
        <a className="brand" href="#main">
          <span className="brand-symbol">◔</span>focus queue
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">
          <span className="mini-avatar">N</span>
          <div>
            My quiet workspace<small>Personal · Local storage</small>
          </div>
        </div>
        <p className="nav-heading">YOUR SPACE</p>
        <a className="nav-item active" href="#main">
          ◫ <span>Today</span>
        </a>
        <a className="nav-item" href="#queue">
          ☷ <span>Task queue</span>
          <b>{pending.length}</b>
        </a>
        <a className="nav-item" href="#history">
          ◷ <span>Session history</span>
        </a>
        <div className="sidebar-thought">
          <span className="thought-symbol">✳</span>
          <p>
            You don’t have to
            <br />
            do it all at once.
          </p>
          <small>Just the next meaningful thing.</small>
        </div>
        <div className="local-status">
          <span>●</span> Your data stays on this device
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span>
            My workspace <b>/</b> <strong>Today</strong>
          </span>
          <div>
            <span className="header-date">
              {new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }).format(now)}
            </span>
            <span className="avatar">NB</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                A LITTLE LESS NOISE. A LITTLE MORE FOCUS.
              </span>
              <h1>
                Make room for <em>one thing.</em>
              </h1>
              <p>A clear queue. A quiet timer. Progress at your own pace.</p>
            </div>
            <button className="export-button" onClick={exportData}>
              Export data ↗
            </button>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
              {blocked && (
                <button className="quiet" onClick={() => setConfirmReset(true)}>
                  Reset saved data
                </button>
              )}
            </div>
          )}
          {confirmReset && (
            <div className="notice error">
              <p>
                This removes saved tasks, timer, and history in this browser.
                Export first if you need to keep them.
              </p>
              <button
                className="quiet"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
              >
                Reset all data
              </button>
              <button className="quiet" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          )}
          {state.lastFinished && (
            <div className="notice success" role="status">
              {state.lastFinished.mode === "focus"
                ? `✓ Focus session complete: ${state.lastFinished.title}. Your progress is saved.`
                : "✓ Break complete. Come back when you’re ready."}
            </div>
          )}
          {deleted && (
            <div className="notice" role="status">
              Deleted “{deleted.title}”.
              <button
                className="quiet"
                onClick={() => {
                  if (dispatch({ type: "restoreTask", task: deleted }))
                    setDeleted(null);
                }}
              >
                Undo
              </button>
              <button
                className="quiet"
                onClick={() => setDeleted(null)}
                aria-label="Dismiss deletion notice"
              >
                ×
              </button>
            </div>
          )}
          <section className="stats" aria-label="Today’s progress">
            <article>
              <span className="stat-icon terracotta">◴</span>
              <div>
                <span>Focus time today</span>
                <strong>
                  {minutes}
                  <small> min</small>
                </strong>
              </div>
              <span className="stat-detail">Time well spent</span>
            </article>
            <article>
              <span className="stat-icon sage">✓</span>
              <div>
                <span>Sessions today</span>
                <strong>{todays.length.toString().padStart(2, "0")}</strong>
              </div>
              <span className="stat-detail">One step at a time</span>
            </article>
            <article>
              <span className="stat-icon lavender">☷</span>
              <div>
                <span>Tasks in queue</span>
                <strong>{pending.length.toString().padStart(2, "0")}</strong>
              </div>
              <span className="stat-detail">
                {pending.filter((t) => t.priority === "high").length} high
                priority
              </span>
            </article>
          </section>
          <div className="workspace-grid">
            <div className="left-column">
              <TaskList
                tasks={state.tasks}
                selectedId={activeId}
                onSelect={setSelectedId}
                onSave={(task) => dispatch({ type: "saveTask", task })}
                onToggle={(id) => dispatch({ type: "toggleTask", id })}
                onDelete={(task) => {
                  if (dispatch({ type: "deleteTask", id: task.id }))
                    setDeleted(task);
                }}
                busy={!!state.timer}
                disabled={blocked}
              />
              <SessionHistory sessions={state.sessions} />
              <div className="gentle-note">
                <span>✦</span>
                <p>
                  Finishing a timer records your focus time. Mark the task
                  complete when the work itself is done.
                </p>
              </div>
            </div>
            <FocusTimer
              timer={state.timer}
              selected={selected}
              now={now}
              dispatch={dispatch}
              disabled={blocked}
              onClearSelection={() => setSelectedId(null)}
            />
          </div>
          <footer>
            <span>Less busy. More intentional.</span>
            <span>Focus Queue · Built with React</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
