import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Countdown } from "./countdown";

const ENDS_AT = "2026-01-01T12:00:00.000Z";
const ENDS_AT_MS = Date.parse(ENDS_AT);

/**
 * Advancing fake timers moves the faked `Date` too, so the system time is set
 * with a 500ms cushion: a tick never flips the displayed second on its own.
 */
function startAt(remainingMs: number) {
  vi.setSystemTime(ENDS_AT_MS - remainingMs - 500);
}

/** Flushes the timeout that delivers the first real timestamp. */
async function firstTick() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
}

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "Date",
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
      ],
    });
    startAt(90_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a placeholder before mounting, so hydration matches", () => {
    render(<Countdown target={ENDS_AT} />);

    expect(screen.getByText("--:--")).toBeInTheDocument();
  });

  it("counts down once the first tick lands", async () => {
    render(<Countdown target={ENDS_AT} />);

    await firstTick();

    expect(screen.getByText("01:30")).toBeInTheDocument();
  });

  it("ticks every second", async () => {
    render(<Countdown target={ENDS_AT} />);
    await firstTick();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(screen.getByText("01:28")).toBeInTheDocument();
  });

  it("corrects for a device clock that runs behind the server", async () => {
    // The server is 30s ahead, so 30s less is left than the device thinks.
    render(<Countdown target={ENDS_AT} offsetMs={-30_000} />);

    await firstTick();

    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("stops at zero rather than going negative", async () => {
    vi.setSystemTime(ENDS_AT_MS + 5_000);
    render(<Countdown target={ENDS_AT} />);

    await firstTick();

    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("renders nothing for an unparseable timestamp", () => {
    const { container } = render(<Countdown target="not-a-date" />);

    expect(container).toBeEmptyDOMElement();
  });
});
