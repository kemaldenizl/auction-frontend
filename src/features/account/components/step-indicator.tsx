import { cn } from "@/shared/lib/cn";

/** "Adım 1/3" with a progress track — for multi-step account changes. */
export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Adım ${step} / ${total}`}>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500 ease-out-expo",
              index < step ? "w-5 bg-gradient-brand" : "w-1.5 bg-line-strong",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-subtle tabular">
        {step}/{total}
      </span>
    </div>
  );
}
