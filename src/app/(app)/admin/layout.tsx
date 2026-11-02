import { LayoutGrid, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { Suspense } from "react";

import {
  NavTabs,
  NavTabsFallback,
  PageHeader,
  type NavTabItem,
} from "@/shared/ui";

const TABS: NavTabItem[] = [
  { href: "/admin", label: "Genel bakış", icon: <LayoutGrid />, exact: true },
  { href: "/admin/roles", label: "Roller", icon: <UsersRound /> },
  { href: "/admin/permissions", label: "Yetkiler", icon: <ShieldCheck /> },
  { href: "/admin/users", label: "Kullanıcı rolleri", icon: <UserCog /> },
];

/**
 * The chrome only — each page carries its own `RequireAuth`, which also
 * decides the permission that page needs.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <PageHeader
        eyebrow="Yönetim"
        title="Yetki yönetimi"
        description="Rolleri düzenleyin, yetkileri dağıtın ve kullanıcılara rol atayın."
      />
      <div className="space-y-6">
        <Suspense
          fallback={
            <NavTabsFallback
              items={TABS}
              variant="underline"
              label="Yönetim menüsü"
            />
          }
        >
          <NavTabs items={TABS} variant="underline" label="Yönetim menüsü" />
        </Suspense>
        {children}
      </div>
    </>
  );
}
