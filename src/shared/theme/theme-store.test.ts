import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  THEME_BOOT_SCRIPT,
  THEME_STORAGE_KEY,
  cycleTheme,
  getThemeSnapshot,
  resetThemeStore,
  setTheme,
  subscribeToTheme,
} from "./theme-store";

let prefersDark = false;

function attribute(): string | null {
  return document.documentElement.getAttribute("data-theme");
}

describe("theme store", () => {
  beforeEach(() => {
    prefersDark = false;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: prefersDark,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    resetThemeStore();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
  });

  it("follows the system until the user picks", () => {
    expect(getThemeSnapshot()).toBe("system");
  });

  it("applies and remembers an explicit choice", () => {
    setTheme("dark");

    expect(attribute()).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('"dark"');
  });

  it("resolves 'system' from the operating system", () => {
    prefersDark = true;
    setTheme("system");

    expect(attribute()).toBe("dark");
  });

  it("cycles light → dark → system", () => {
    setTheme("light");
    cycleTheme();
    expect(getThemeSnapshot()).toBe("dark");
    cycleTheme();
    expect(getThemeSnapshot()).toBe("system");
  });

  it("notifies subscribers", () => {
    const listener = vi.fn();
    subscribeToTheme(listener);

    setTheme("dark");

    expect(listener).toHaveBeenCalled();
  });

  it("boot script reads the same key and sets the theme before paint", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, '"dark"');

    // The script runs in <head> before any bundle; executing it here proves
    // it agrees with the store about key and format.
    new Function(THEME_BOOT_SCRIPT)();

    expect(attribute()).toBe("dark");
  });
});
