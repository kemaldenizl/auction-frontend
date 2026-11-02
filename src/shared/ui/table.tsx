import type { ReactNode, ThHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export function Table({
  caption,
  className,
  children,
}: {
  /** Visually hidden, but it is what a screen reader announces. */
  caption: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-surface-muted/50 text-xs text-subtle">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TableRow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 hover:bg-surface-muted/50",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      {...props}
      className={cn("px-5 py-3 font-medium", className)}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <td className={cn("px-5 py-3.5 align-middle", className)}>{children}</td>;
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-subtle">
        {children}
      </td>
    </tr>
  );
}
