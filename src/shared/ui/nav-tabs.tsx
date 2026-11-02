"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface NavTabItem {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Match only the exact path, not descendants. */
  exact?: boolean;
}

export type NavTabsVariant = "pill" | "underline";

const VARIANTS: Record<
  NavTabsVariant,
  { list: string; base: string; active: string; idle: string }
> = {
  pill: {
    list: "flex items-center gap-1",
    base: "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-[color,background-color] duration-200 [&_svg]:size-4",
    active: "bg-brand-soft text-brand",
    idle: "text-muted hover:bg-surface-muted hover:text-fg",
  },
  underline: {
    list: "flex items-center gap-1 overflow-x-auto border-b border-line",
    base: "relative -mb-px flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:origin-center after:rounded-full after:bg-gradient-brand after:transition-transform after:duration-300 after:ease-out-expo [&_svg]:size-4",
    active: "text-fg after:scale-x-100",
    idle: "text-muted after:scale-x-0 hover:text-fg",
  },
};

function isActive(pathname: string | null, { href, exact }: NavTabItem) {
  if (pathname === null) return false;
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function TabList({
  items,
  variant,
  pathname,
  label,
}: {
  items: readonly NavTabItem[];
  variant: NavTabsVariant;
  pathname: string | null;
  label: string;
}) {
  const styles = VARIANTS[variant];

  return (
    <nav aria-label={label} className={styles.list}>
      {items.map((item) => {
        const active = isActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(styles.base, active ? styles.active : styles.idle)}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export interface NavTabsProps {
  items: readonly NavTabItem[];
  variant?: NavTabsVariant;
  label: string;
}

/**
 * Prerendered shell: the same links with nothing highlighted.
 *
 * On a route with a dynamic param the pathname is unknown at build time and
 * `usePathname` suspends, so every `NavTabs` belongs inside a `<Suspense>`
 * with this as its fallback.
 */
export function NavTabsFallback({
  items,
  variant = "pill",
  label,
}: NavTabsProps) {
  return (
    <TabList items={items} variant={variant} pathname={null} label={label} />
  );
}

export function NavTabs({ items, variant = "pill", label }: NavTabsProps) {
  return (
    <TabList
      items={items}
      variant={variant}
      pathname={usePathname()}
      label={label}
    />
  );
}
