import { useMemo, useState } from "react";
import { visibleTasks, type Task } from "../model";
import { TaskEditor } from "./TaskEditor";
export function TaskList({
  tasks,
  selectedId,
  onSelect,
  onSave,
  onToggle,
  onDelete,
  busy,
  disabled,
}: {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSave: (task: Task) => boolean;
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  busy: boolean;
  disabled: boolean;
}) {
  const [filter, setFilter] = useState("queue");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const rows = useMemo(
    () => visibleTasks(tasks, query, filter),
    [tasks, query, filter],
  );
  return (
    <section className="panel queue" id="queue">
      <div className="panel-title">
        <div>
          <span className="eyebrow">MAKE SPACE FOR WHAT MATTERS</span>
          <h2>
            Your queue{" "}
            <span className="count">{tasks.filter((t) => !t.done).length}</span>
          </h2>
        </div>
        <span className="muted">Priority first</span>
      </div>
      <fieldset disabled={disabled} className="editor-fieldset">
        <TaskEditor onSave={onSave} />
      </fieldset>
      <div className="queue-toolbar">
        <div className="tabs" aria-label="Task filters">
          {[
            ["queue", "To do"],
            ["done", "Completed"],
            ["all", "All tasks"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search tasks</span>
          <input
            type="search"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <ul className="task-list">
        {rows.map((task) => (
          <li
            key={task.id}
            className={`${task.done ? "done" : ""} ${selectedId === task.id ? "chosen" : ""}`}
          >
            {editing === task.id ? (
              <TaskEditor
                task={task}
                onSave={(value) => {
                  const saved = onSave(value);
                  if (saved) setEditing(null);
                  return saved;
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={task.done}
                  disabled={disabled}
                  aria-label={`${task.done ? "Reopen" : "Complete"} ${task.title}`}
                  onChange={() => onToggle(task.id)}
                />
                <div className="task-copy">
                  <strong>{task.title}</strong>
                  <span className={`priority ${task.priority}`}>
                    <i aria-hidden="true" /> {task.priority} priority
                  </span>
                </div>
                <div className="task-actions">
                  {!task.done && (
                    <button
                      className={
                        selectedId === task.id ? "selected-task" : "focus-task"
                      }
                      disabled={busy || disabled}
                      onClick={() => onSelect(task.id)}
                      aria-label={`Focus on ${task.title}`}
                    >
                      {selectedId === task.id ? "Selected" : "Focus"}{" "}
                      <span aria-hidden="true">↗</span>
                    </button>
                  )}
                  <button
                    className="quiet"
                    disabled={disabled}
                    onClick={() => setEditing(task.id)}
                    aria-label={`Edit ${task.title}`}
                  >
                    Edit
                  </button>
                  <button
                    className="quiet delete"
                    disabled={disabled}
                    onClick={() => onDelete(task)}
                    aria-label={`Delete ${task.title}`}
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <div className="queue-empty">
          <span aria-hidden="true">☷</span>
          <h3>
            {tasks.length
              ? "Nothing here just yet."
              : "A clear mind starts with a small list."}
          </h3>
          <p>
            {tasks.length
              ? "Try another filter or add your next task."
              : "Add one thing you want to move forward today."}
          </p>
        </div>
      )}
      <div className="queue-footer">
        <span>One task. Your full attention.</span>
        <span>{tasks.filter((t) => t.done).length} completed</span>
      </div>
    </section>
  );
}
