"use client";

import { BadgeCheck, CircleUserRound, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/features/auth/hooks/use-session";
import { permissionLabel } from "@/features/auth/model/permissions";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  DescriptionItem,
  DescriptionList,
} from "@/shared/ui";

export function ProfilePanel() {
  const { user, identity, permissions } = useSession();

  const email = identity?.email ?? user?.email ?? "";
  const userId = identity?.userId ?? user?.id ?? "";

  return (
    <div className="space-y-6">
      {user && !user.emailVerified && (
        <Alert tone="warning" title="E-posta adresinizi doğrulayın">
          Doğrulama e-postasını bulamıyorsanız{" "}
          <Link href="/verify-email" className="font-medium underline">
            yeniden gönderebilirsiniz
          </Link>
          .
        </Alert>
      )}

      <Card className="animate-fade-up overflow-hidden">
        <div className="h-24 bg-gradient-brand bg-[length:200%_200%] animate-gradient-pan" />
        <CardBody className="-mt-12 space-y-4">
          <span className="grid size-20 place-items-center rounded-3xl border-4 border-surface bg-gradient-brand text-3xl font-semibold text-white shadow-lift">
            {(email[0] ?? "?").toLocaleUpperCase("tr-TR")}
          </span>
          <div>
            <p className="text-xl font-semibold text-fg">{email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={user?.isActive === false ? "danger" : "success"}>
                <CircleUserRound />
                {user?.isActive === false ? "Hesap pasif" : "Hesap aktif"}
              </Badge>
              <Badge tone={user?.emailVerified ? "success" : "warning"}>
                <BadgeCheck />
                {user?.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulanmadı"}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<KeyRound />}
          title="Hesap bilgileri"
        />
        <CardBody className="pt-0">
          <DescriptionList>
            <DescriptionItem term="E-posta">{email || "—"}</DescriptionItem>
            <DescriptionItem term="Üye numarası">
              {/* Shared with an administrator to be granted a role. */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-muted">{userId || "—"}</span>
                {userId && <CopyButton value={userId} />}
              </div>
            </DescriptionItem>
          </DescriptionList>
        </CardBody>
      </Card>

      {permissions.length > 0 && (
        <Card>
          <CardHeader
            icon={<ShieldCheck />}
            title="Yetkileriniz"
            description="Hesabınıza tanımlı yönetim yetkileri."
          />
          <CardBody>
            <ul className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <li key={permission}>
                  <Badge tone="brand">{permissionLabel(permission)}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
