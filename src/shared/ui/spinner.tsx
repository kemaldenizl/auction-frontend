import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export function Spinner({
  className,
  label = "Yükleniyor",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <LoaderCircle
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
    />
  );
}
