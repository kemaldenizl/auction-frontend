import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/** Shared with link-styled buttons (`buttonClassName`) so both look the same. */
const BASE = cn(
  "relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl font-medium cursor-pointer",
  "transition-[transform,background-color,box-shadow,color,opacity] duration-200 ease-out-expo cursor-pointer",
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 cursor-pointer",
);

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-brand text-white shadow-[0_6px_20px_-8px] shadow-brand/60",
    "hover:shadow-glow hover:brightness-110",
  ),
  secondary:
    "border border-line bg-surface text-fg shadow-card hover:border-line-strong hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-fg",
  danger:
    "border border-danger/30 bg-danger-soft text-danger hover:border-danger/60 hover:bg-danger/15",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5",
  md: "h-10 gap-2 px-4 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2 px-6 text-base [&_svg]:size-5",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction while a request is in flight. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, className })}
    >
      {loading && <Spinner label="Gönderiliyor" />}
      {children}
    </button>
  );
}
