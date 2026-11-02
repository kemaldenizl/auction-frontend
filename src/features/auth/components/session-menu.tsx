"use client";

import {
  ChevronDown,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Skeleton, Spinner, buttonClassName, toast } from "@/shared/ui";

import { useSession } from "../hooks/use-session";
import { ADMIN_PERMISSIONS } from "../model/permissions";
import { signOut } from "../model/session-store";

const ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-fg [&_svg]:size-4";

export function SessionMenu() {
  const { status, user, identity, canAny } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return <Skeleton className="h-9 w-28 rounded-full" />;
  }

  if (status === "anonymous") {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/login"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
        >
          Giriş yap
        </Link>
        <Link href="/register" className={buttonClassName({ size: "sm" })}>
          Kayıt ol
        </Link>
      </div>
    );
  }

  const email = identity?.email ?? user?.email ?? "";
  const initial = (email[0] ?? "?").toLocaleUpperCase("tr-TR");

  async function leave() {
    setLeaving(true);
    await signOut();
    setOpen(false);
    setLeaving(false);
    toast("Oturumunuz kapatıldı. Görüşmek üzere!");
    router.push("/");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-label={`Hesap menüsü: ${email}`}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pr-2.5 pl-1 text-sm font-medium text-fg transition-colors hover:border-line-strong"
      >
        <span className="grid size-7 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{email}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-subtle transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 origin-top-right animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
        >
          <div className="px-3 py-2.5">
            <p className="text-xs text-subtle">Giriş yapılan hesap</p>
            <p className="truncate text-sm font-medium text-fg">{email}</p>
          </div>
          <div className="my-1 h-px bg-line" />

          <Link href="/account" role="menuitem" className={ITEM} onClick={() => setOpen(false)}>
            <UserRound /> Profilim
          </Link>
          <Link href="/account/security" role="menuitem" className={ITEM} onClick={() => setOpen(false)}>
            <KeyRound /> Güvenlik
          </Link>
          <Link href="/account/sessions" role="menuitem" className={ITEM} onClick={() => setOpen(false)}>
            <MonitorSmartphone /> Oturumlarım
          </Link>
          {canAny(ADMIN_PERMISSIONS) && (
            <Link href="/admin" role="menuitem" className={ITEM} onClick={() => setOpen(false)}>
              <Settings /> Yönetim
            </Link>
          )}

          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={leave}
            disabled={leaving}
            className={cn(ITEM, "text-danger hover:bg-danger-soft hover:text-danger")}
          >
            {leaving ? <Spinner /> : <LogOut />}
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
