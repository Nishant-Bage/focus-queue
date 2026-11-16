import { useRef, useState, type FormEvent } from "react";
import type { Priority, Task } from "../model";
export function TaskEditor({
  onSave,
  task,
  onCancel,
}: {
  onSave: (task: Task) => boolean;
  task?: Task;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "medium",
  );
  const input = useRef<HTMLInputElement>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const value = {
      id: task?.id ?? crypto.randomUUID(),
      title: title.trim(),
      priority,
      done: task?.done ?? false,
      createdAt: task?.createdAt ?? Date.now(),
    };
    if (onSave(value)) {
      setTitle("");
      input.current?.focus();
    }
  }
  return (
    <form className="task-editor" onSubmit={submit}>
      <label className="task-input">
        <span className="sr-only">
          {task ? "Edit task name" : "New task name"}
        </span>
        <input
          ref={input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What would you like to work on?"
          maxLength={160}
          required
        />
      </label>
      <label>
        <span className="sr-only">Task priority</span>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </label>
      <button className="primary" type="submit" disabled={!title.trim()}>
        {task ? "Save" : "＋ Add task"}
      </button>
      {onCancel && (
        <button type="button" className="quiet" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}
