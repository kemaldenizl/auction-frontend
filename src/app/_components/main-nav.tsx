"use client";

import { Gavel, Package, Settings } from "lucide-react";

import { useSession } from "@/features/auth/hooks/use-session";
import { ADMIN_PERMISSIONS } from "@/features/auth/model/permissions";
import { NavTabs, NavTabsFallback, type NavTabItem } from "@/shared/ui";

const PUBLIC_ITEMS: NavTabItem[] = [
  { href: "/auctions", label: "Açık artırmalar", icon: <Gavel /> },
  { href: "/products", label: "Ürünler", icon: <Package /> },
];

const ADMIN_ITEM: NavTabItem = {
  href: "/admin",
  label: "Yönetim",
  icon: <Settings />,
};

/**
 * Prerendered shell: the public links with nothing highlighted.
 *
 * `usePathname` is URL data, so on a route with a dynamic param it suspends.
 * This fallback keeps the header in the static shell.
 */
export function MainNavFallback() {
  return <NavTabsFallback items={PUBLIC_ITEMS} label="Ana menü" />;
}

export function MainNav() {
  const { canAny } = useSession();

  const items = canAny(ADMIN_PERMISSIONS)
    ? [...PUBLIC_ITEMS, ADMIN_ITEM]
    : PUBLIC_ITEMS;

  return <NavTabs items={items} label="Ana menü" />;
}
