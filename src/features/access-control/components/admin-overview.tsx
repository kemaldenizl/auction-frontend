"use client";

import Link from "next/link";

import { useSession } from "@/features/auth/hooks/use-session";
import {
  PERMISSION,
  permissionLabel,
  type PermissionCode,
} from "@/features/auth/model/permissions";
import { Badge, Card, CardBody } from "@/shared/ui";

const SECTIONS: {
  href: string;
  title: string;
  description: string;
  needs: PermissionCode;
}[] = [
  {
    href: "/admin/roles",
    title: "Roller",
    description: "Rol oluşturun, adlandırın ve izinlerini düzenleyin.",
    needs: PERMISSION.rolesRead,
  },
  {
    href: "/admin/permissions",
    title: "Yetkiler",
    description: "Sistemdeki yetkileri görün ve yönetin.",
    needs: PERMISSION.permissionsRead,
  },
  {
    href: "/admin/users",
    title: "Kullanıcı rolleri",
    description: "Bir kullanıcıya rol atayın ya da geri alın.",
    needs: PERMISSION.usersManage,
  },
];

/** Shows every section and says plainly which ones this session may open. */
export function AdminOverview() {
  const { can } = useSession();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SECTIONS.map((section) => {
        const allowed = can(section.needs);

        return (
          <Card key={section.href} interactive={allowed} className="animate-fade-up">
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-fg">
                  {allowed ? (
                    <Link href={section.href} className="hover:text-brand">
                      {section.title}
                    </Link>
                  ) : (
                    section.title
                  )}
                </h2>
                <Badge tone={allowed ? "success" : "neutral"}>
                  {allowed ? "Erişim var" : "Yetki yok"}
                </Badge>
              </div>
              <p className="text-sm text-muted">{section.description}</p>
              <p className="text-xs text-subtle">Gereken yetki: {permissionLabel(section.needs)}</p>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
