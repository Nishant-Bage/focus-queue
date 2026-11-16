import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { FocusTimer } from "./FocusTimer";
import { useFocusQueue } from "../hooks/useFocusQueue";
import { STORAGE_KEY } from "../model";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
});
function TimerHarness() {
  const { state, now, dispatch } = useFocusQueue();
  return (
    <FocusTimer
      timer={state.timer}
      selected={undefined}
      now={now}
      dispatch={dispatch}
      disabled={false}
      onClearSelection={() => {}}
    />
  );
}
it.each([false, true])(
  "ends a session through the visible confirmation (paused: %s)",
  async (paused) => {
    const user = userEvent.setup();
    render(<TimerHarness />);
    await user.click(screen.getByRole("button", { name: /Start focus/ }));
    if (paused) await user.click(screen.getByRole("button", { name: /Pause/ }));
    await user.click(screen.getByRole("button", { name: "End session" }));
    expect(
      screen.getByRole("dialog", { name: "End this session?" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Keep going" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).timer).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "End session" }));
    await user.click(
      screen.getByRole("button", { name: "End without saving" }),
    );
    expect(screen.getByRole("button", { name: /Start focus/ })).toBeVisible();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      timer: null,
      sessions: [],
    });
  },
);
