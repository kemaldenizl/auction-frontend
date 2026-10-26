"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";

const NAV_ITEMS = [
  { href: "/auctions", label: "Açık arttırmalar" },
  { href: "/products", label: "Ürünler" },
] as const;

function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Ana menü" className="flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-surface-muted hover:text-fg",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Prerendered shell: the same links without a highlight.
 *
 * On a route with a dynamic param the pathname is not known at build time, so
 * `usePathname` suspends. This fallback keeps the header in the static shell
 * instead of making the whole route block on request data.
 */
export function MainNavFallback() {
  return <NavList pathname={null} />;
}

export function MainNav() {
  return <NavList pathname={usePathname()} />;
}
