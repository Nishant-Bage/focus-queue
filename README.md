# Focus Queue

A React + TypeScript workspace for prioritizing tasks, focusing on one thing, and keeping a record of completed focus sessions. Built with standard React hooks; no React Query, timer library, server, or account.

## Run locally

Requires Node.js 22.17 or later (developed with Node 24).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Features

- Add and edit tasks with high, medium, or low priority.
- Search and filter unfinished/completed tasks; priority ordering keeps important tasks first.
- Mark tasks complete, reopen them, or delete with one-step undo.
- Select an unfinished task or start an open-focus session without a task.
- Choose 15, 25, 45, or 60 minutes of focus, or a five-minute break.
- Pause, resume, and explicitly end a session without recording an unfinished timer.
- See completed focus history and today's recorded minutes and sessions.
- Keep tasks, active timer, and history in browser storage; export stored JSON for safekeeping.

The workspace starts empty. There are no invented tasks, sample productivity statistics, or fabricated sessions. Completing a timer does not automatically mark a task complete; task completion and elapsed focus are separate actions.

## Timer behavior

A running timer stores an absolute deadline. The display recalculates time remaining from the clock, rather than subtracting one second per interval. Pausing saves the remaining duration; resuming creates a new deadline. An overdue timer is reconciled when the page opens or becomes visible again. Completed focus sessions use the timer's ID to avoid duplicate recording and retain the scheduled finish time.

Closing the page does **not** pause a running timer. If it expires while closed, it is recorded on return. A paused timer remains paused. Short breaks are not added to focus history. History means completed timer durations, not proof that you were actively working. There are no background notifications or alarms while the page is closed. Changing the system clock can affect an active timer.

## Storage and privacy

Everything is saved under `focus-queue:v1` in local storage, specific to this browser and origin. Failed writes leave the previous state intact. Invalid saved data blocks edits until an explicit reset; raw data remains available for export. JSON export is a backup/download, not an in-app restore feature in this version.

Use one tab to manage a workspace: simultaneous edits in multiple tabs are not coordinated. Clearing browser data removes your workspace. The app retains up to 1,000 tasks and the latest 500 completed focus sessions. Daily totals use your browser's local calendar date and retained history. Fonts load from Google Fonts with system fallbacks; task contents are not transmitted.

## Code map

| File                                | Responsibility                                              |
| ----------------------------------- | ----------------------------------------------------------- |
| `src/model.ts`                      | Domain types, validation, pure timer transitions, filtering |
| `src/hooks/useFocusQueue.ts`        | Persistence, clock updates, overdue-session recovery        |
| `src/components/TaskEditor.tsx`     | Reusable create/edit form                                   |
| `src/components/TaskList.tsx`       | Task filters, priority list, task actions                   |
| `src/components/FocusTimer.tsx`     | Timer modes, duration, pause/resume controls                |
| `src/components/SessionHistory.tsx` | Completed session timeline                                  |
| `src/App.tsx`                       | Workspace composition and summary cards                     |

## Verification

Tests cover paused time, resuming, deadline recovery, duplicate completion protection, cancellation, breaks, task lifecycle, corrupted storage, write failures, and local-state recovery. Build checks TypeScript and emits static assets to `dist/`. Native labels, buttons, checkbox controls, visible focus rings, and a skip link support keyboard use. Timer digits are not an every-second live announcement; completion messages use a status region. Automated checks do not certify accessibility or browser compatibility.

## Next improvements

Validated backup restore, coordinated multi-tab editing, configurable break durations, and optional sound after user interaction. This project is local-only until explicitly published.
