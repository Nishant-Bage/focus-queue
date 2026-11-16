import { useState } from "react";
import type { Session } from "../model";
export function SessionHistory({ sessions }: { sessions: Session[] }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? sessions : sessions.slice(0, 5);
  return (
    <section className="panel history" id="history">
      <div className="panel-title">
        <div>
          <span className="eyebrow">SMALL STEPS ADD UP</span>
          <h2>Recent focus sessions</h2>
        </div>
        <span className="muted">{sessions.length} recorded</span>
      </div>
      {sessions.length === 0 ? (
        <div className="history-empty">
          <span aria-hidden="true">◷</span>
          <div>
            <strong>Your first session is a fresh start.</strong>
            <p>Finish a focus timer to see it here. Breaks aren’t counted.</p>
          </div>
        </div>
      ) : (
        <ol>
          {rows.map((session) => (
            <li key={session.id}>
              <span className="session-check" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>{session.title}</strong>
                <time dateTime={new Date(session.completedAt).toISOString()}>
                  {new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(session.completedAt)}
                </time>
              </div>
              <b>
                {session.durationMs / 60000}
                <small> min</small>
              </b>
            </li>
          ))}
        </ol>
      )}
      {sessions.length > 5 && (
        <button className="quiet" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : `Show all ${sessions.length} sessions`}
        </button>
      )}
    </section>
  );
}
