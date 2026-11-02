"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/shared/lib/cn";

import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeToTheme,
  type ThemePreference,
} from "./theme-store";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "light", label: "Açık tema", Icon: Sun },
  { value: "dark", label: "Koyu tema", Icon: Moon },
  { value: "system", label: "Sistem teması", Icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const activeIndex = OPTIONS.findIndex((option) => option.value === preference);

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "relative inline-flex items-center rounded-full border border-line bg-surface-muted/60 p-0.5",
        className,
      )}
    >
      {/* The pill slides under the active option. */}
      <span
        aria-hidden
        className="absolute top-0.5 left-0.5 size-7 rounded-full bg-surface shadow-card transition-transform duration-300 ease-spring"
        style={{ transform: `translateX(${activeIndex * 1.75}rem)` }}
      />
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = value === preference;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "relative z-10 grid size-7 place-items-center rounded-full transition-colors",
              active ? "text-brand" : "text-subtle hover:text-fg",
            )}
          >
            <Icon
              className={cn(
                "size-3.5 transition-transform duration-500",
                active && "rotate-[360deg] scale-110",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
