import { KeyRound, MonitorSmartphone, UserRound } from "lucide-react";
import { Suspense } from "react";

import {
  NavTabs,
  NavTabsFallback,
  PageHeader,
  type NavTabItem,
} from "@/shared/ui";

const TABS: NavTabItem[] = [
  { href: "/account", label: "Profil", icon: <UserRound />, exact: true },
  { href: "/account/security", label: "Güvenlik", icon: <KeyRound /> },
  { href: "/account/sessions", label: "Oturumlar", icon: <MonitorSmartphone /> },
];

/**
 * The chrome only — each page carries its own `RequireAuth`, so the header and
 * tabs show while the session resolves instead of the whole screen waiting.
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <>
      <PageHeader
        eyebrow="Hesap"
        title="Hesabım"
        description="Profiliniz, güvenlik ayarlarınız ve giriş yaptığınız cihazlar."
      />
      <div className="space-y-6">
        <Suspense
          fallback={
            <NavTabsFallback
              items={TABS}
              variant="underline"
              label="Hesap menüsü"
            />
          }
        >
          <NavTabs items={TABS} variant="underline" label="Hesap menüsü" />
        </Suspense>
        {children}
      </div>
    </>
  );
}
