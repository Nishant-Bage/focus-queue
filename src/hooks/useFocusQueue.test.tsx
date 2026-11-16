import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useFocusQueue } from "./useFocusQueue";
import { emptyState, remaining, STORAGE_KEY, transition } from "../model";
it("starts with the exact duration between interval ticks", () => {
  vi.useFakeTimers();
  vi.setSystemTime(1800000000000);
  const { result } = renderHook(() => useFocusQueue());
  act(() => vi.advanceTimersByTime(450));
  act(() => {
    result.current.dispatch({
      type: "start",
      id: "fresh",
      taskId: null,
      mode: "focus",
      minutes: 25,
    });
  });
  expect(remaining(result.current.state.timer!, result.current.now)).toBe(
    25 * 60000,
  );
});
it("reconciles an overdue persisted timer once when mounted", () => {
  vi.useFakeTimers();
  vi.setSystemTime(1800000000000);
  const saved = transition(
    emptyState(),
    { type: "start", id: "persisted", taskId: null, mode: "focus", minutes: 1 },
    Date.now() - 120000,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  const { result } = renderHook(() => useFocusQueue());
  expect(result.current.state.sessions).toHaveLength(1);
  act(() => vi.advanceTimersByTime(3000));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).sessions).toHaveLength(
    1,
  );
});
it("retains existing state if a persistence write fails", () => {
  const { result } = renderHook(() => useFocusQueue());
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage full");
  });
  act(() => {
    result.current.dispatch({
      type: "start",
      id: "s",
      taskId: null,
      mode: "focus",
      minutes: 25,
    });
  });
  expect(result.current.state.timer).toBeNull();
  expect(result.current.error).toBe("Storage full");
});
it("blocks edits when saved data is corrupt until an explicit reset", () => {
  localStorage.setItem(STORAGE_KEY, "broken");
  const { result } = renderHook(() => useFocusQueue());
  expect(result.current.blocked).toBe(true);
  act(() => {
    result.current.dispatch({
      type: "start",
      id: "s",
      taskId: null,
      mode: "focus",
      minutes: 25,
    });
  });
  expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
  act(() => result.current.reset());
  expect(result.current.blocked).toBe(false);
  expect(result.current.state).toEqual(emptyState());
});
