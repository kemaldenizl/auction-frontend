import { Check } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import { PASSWORD_RULES } from "../model/password";

/** Ticks each rule off as the user types, before anything is submitted. */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Parola kuralları">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);

        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-300",
              met ? "text-success" : "text-subtle",
            )}
          >
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border transition-all duration-300 ease-spring",
                met
                  ? "scale-100 border-success bg-success text-white"
                  : "scale-90 border-line-strong",
              )}
            >
              <Check
                className={cn(
                  "size-2.5 transition-opacity",
                  met ? "opacity-100" : "opacity-0",
                )}
                strokeWidth={3.5}
              />
            </span>
            {rule.label}
            <span className="sr-only">{met ? " — tamam" : " — eksik"}</span>
          </li>
        );
      })}
    </ul>
  );
}
