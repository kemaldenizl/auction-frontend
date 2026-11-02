"use client";

import { AppWindow, Laptop, LogOut, MonitorSmartphone, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useSession } from "@/features/auth/hooks/use-session";
import type { UserSession } from "@/features/auth/model/auth";
import {
  signOutEverywhere,
  signOutLocally,
} from "@/features/auth/model/session-store";
import { errorMessage } from "@/shared/api";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";
import {
  ApiErrorPanel,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  stagger,
  toast,
} from "@/shared/ui";

import { sessionsApi } from "../api/sessions-api";
import { describeDevice, type DeviceKind } from "../lib/device-name";

const DEVICE_ICON: Record<DeviceKind, typeof Laptop> = {
  desktop: Laptop,
  mobile: Smartphone,
  other: AppWindow,
};

export function SessionsPanel() {
  const router = useRouter();
  const { identity } = useSession();

  const load = useCallback(
    (signal: AbortSignal) => sessionsApi.list(signal),
    [],
  );
  const { data, error, loading, reload } = useAsyncData(load);

  const [revoking, setRevoking] = useState<UserSession | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [pending, setPending] = useState(false);

  const isCurrent = (session: UserSession) =>
    session.isCurrent || session.sessionId === identity?.sessionId;

  async function revoke() {
    if (!revoking) return;
    setPending(true);

    try {
      await sessionsApi.revoke(revoking.sessionId);

      // Closing this device's session ends it on the server already; only the
      // local copy is left to drop. Signing out *everywhere* here — as this
      // used to — would have logged the user out of every other device too.
      if (isCurrent(revoking)) {
        signOutLocally();
        toast("Bu cihazdaki oturum kapatıldı.");
        router.push("/login");
        return;
      }

      toast("Oturum kapatıldı.");
      reload();
    } catch (cause) {
      toast(errorMessage(cause, "Oturum kapatılamadı."), "danger");
    } finally {
      setPending(false);
      setRevoking(null);
    }
  }

  async function leaveEverywhere() {
    setPending(true);
    await signOutEverywhere();
    toast("Tüm cihazlardaki oturumlarınız kapatıldı.");
    router.push("/login");
  }

  // Closed sessions are history, not something to act on; list them last.
  const sessions = [...(data ?? [])].sort(
    (a, b) => Number(a.revoked) - Number(b.revoked),
  );

  return (
    <Card>
      <CardHeader
        icon={<MonitorSmartphone />}
        title="Açık oturumlar"
        description="Hesabınıza giriş yapılan cihazlar."
        action={
          <Button variant="danger" size="sm" onClick={() => setConfirmAll(true)}>
            <LogOut /> Tümünden çık
          </Button>
        }
      />
      <CardBody className="p-0">
        {error ? (
          <div className="p-5">
            <ApiErrorPanel problem={error.problem} />
          </div>
        ) : loading && !data ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Açık oturum görünmüyor" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((session, index) => {
              const device = describeDevice(session.deviceName);
              const Icon = DEVICE_ICON[device.kind];
              const current = isCurrent(session);

              return (
                <li
                  key={session.sessionId}
                  style={stagger(index, 40)}
                  className={cn(
                    "flex animate-fade-up flex-wrap items-center gap-4 px-5 py-4 stagger",
                    session.revoked && "opacity-55",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      current ? "bg-gradient-brand text-white" : "bg-surface-muted text-muted",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                      {device.label}
                      {current && <Badge tone="brand">Bu cihaz</Badge>}
                      {session.revoked && <Badge>Kapatıldı</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">
                      {formatDateTime(session.createdAtUtc)} tarihinde açıldı
                      {session.ipAddress && ` · ${session.ipAddress}`}
                    </p>
                  </div>

                  {!session.revoked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevoking(session)}
                    >
                      Oturumu kapat
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>

      <ConfirmDialog
        open={revoking !== null}
        title="Oturum kapatılsın mı?"
        description={
          revoking && isCurrent(revoking)
            ? "Bu, şu an kullandığınız cihaz. Kapatırsanız çıkış yapılır."
            : "Bu cihazdaki oturum hemen sonlanır."
        }
        confirmLabel="Oturumu kapat"
        destructive
        pending={pending}
        onConfirm={revoke}
        onCancel={() => setRevoking(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        title="Tüm cihazlardan çıkılsın mı?"
        description="Bu cihaz dahil her yerde oturumunuz kapanır ve yeniden giriş yapmanız gerekir."
        confirmLabel="Tümünden çık"
        destructive
        pending={pending}
        onConfirm={leaveEverywhere}
        onCancel={() => setConfirmAll(false)}
      />
    </Card>
  );
}
