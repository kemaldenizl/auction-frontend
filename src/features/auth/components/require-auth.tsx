"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { EmptyState, Skeleton, buttonClassName } from "@/shared/ui";

import { useSession } from "../hooks/use-session";
import { permissionLabel, type PermissionCode } from "../model/permissions";

function Pending() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40" />
    </div>
  );
}

/**
 * Client-side gate for a page that needs a session.
 *
 * It keeps unusable screens off the display; the server is what enforces
 * access, and it answers 401/403 whatever the UI decides to render.
 */
export function RequireAuth({
  permission,
  children,
}: {
  permission?: PermissionCode;
  children: ReactNode;
}) {
  const session = useSession();
  const router = useRouter();
  const { status, endedBy } = session;

  useEffect(() => {
    // A deliberate sign-out navigates by itself; sending the user to the login
    // screen as well would race it and land them somewhere they did not ask.
    if (status !== "anonymous" || endedBy === "signed-out") return;

    // Read the location from the browser rather than `usePathname`, which is
    // URL data and would make every guarded route block on request time.
    const next = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    router.replace(`/login?next=${next}`);
  }, [status, endedBy, router]);

  if (status !== "authenticated") return <Pending />;

  if (permission && !session.can(permission)) {
    return (
      <EmptyState
        icon={<ShieldAlert />}
        title="Bu sayfayı görüntüleme yetkiniz yok"
        description={`Bu bölüm için “${permissionLabel(permission)}” yetkisi gerekiyor. Yöneticinizden bu yetkiyi isteyebilirsiniz.`}
        action={
          <Link href="/" className={buttonClassName()}>
            Ana sayfaya dön
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}

/** Shows its children only when the session holds the permission. */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: PermissionCode;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = useSession();
  return <>{can(permission) ? children : fallback}</>;
}
