import {
  browserStorage,
  readJson,
  writeJson,
} from "@/shared/lib/browser-storage";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "auction.theme";

const ORDER: readonly ThemePreference[] = ["light", "dark", "system"];
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs in <head> before first paint, so the page never flashes the wrong
 * theme. It has to stay self-contained: it executes before any bundle loads.
 * Keep the storage key and the resolution rule in step with the code below.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||'"system"');var d=p==="dark"||(p!=="light"&&matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

let preference: ThemePreference | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(value: ThemePreference): ResolvedTheme {
  if (value === "system") return systemPrefersDark() ? "dark" : "light";
  return value;
}

function apply(value: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveTheme(value));
}

export function getThemeSnapshot(): ThemePreference {
  if (preference === null) {
    preference =
      readJson(browserStorage(), THEME_STORAGE_KEY, isPreference) ?? "system";
  }
  return preference;
}

/** The server cannot know; the boot script has already fixed the DOM. */
export function getThemeServerSnapshot(): ThemePreference {
  return "system";
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);

  // While following the OS, an OS-level switch should restyle live.
  const media =
    typeof window === "undefined" ? null : window.matchMedia(DARK_QUERY);
  const onSystemChange = () => {
    if (getThemeSnapshot() === "system") {
      apply("system");
      emit();
    }
  };
  media?.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", onSystemChange);
  };
}

export function setTheme(next: ThemePreference): void {
  preference = next;
  writeJson(browserStorage(), THEME_STORAGE_KEY, next);
  apply(next);
  emit();
}

export function cycleTheme(): void {
  const current = getThemeSnapshot();
  setTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);
}

/** Test seam. */
export function resetThemeStore(): void {
  preference = null;
  listeners.clear();
}
