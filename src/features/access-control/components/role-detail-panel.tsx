"use client";

import { ArrowLeft, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { useSession } from "@/features/auth/hooks/use-session";
import { PERMISSION, permissionLabel } from "@/features/auth/model/permissions";
import { errorMessage } from "@/shared/api";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import { cn } from "@/shared/lib/cn";
import {
  Alert,
  ApiErrorPanel,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Skeleton,
  Spinner,
  toast,
} from "@/shared/ui";

import { permissionsApi, rolesApi } from "../api/access-control-api";

export function RoleDetailPanel({ roleId }: { roleId: string }) {
  const { can } = useSession();
  const manage = can(PERMISSION.rolesManage);

  const loadRole = useCallback(
    (signal: AbortSignal) => rolesApi.get(roleId, signal),
    [roleId],
  );
  const role = useAsyncData(loadRole);

  // Loaded separately: an operator may hold roles.manage without
  // permissions.read, and a failure here must not hide the role itself.
  const loadPermissions = useCallback(
    (signal: AbortSignal) => permissionsApi.list(signal),
    [],
  );
  const catalogue = useAsyncData(loadPermissions);

  const rename = useFormSubmit();
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const submitRename = rename.submit(async () => {
    await rolesApi.rename(roleId, (name ?? "").trim());
    toast("Rol adı güncellendi.");
    role.reload();
  });

  async function toggle(permissionId: string, attached: boolean) {
    setBusy(permissionId);

    try {
      await (attached
        ? rolesApi.removePermission(roleId, permissionId)
        : rolesApi.addPermission(roleId, permissionId));
      role.reload();
    } catch (cause) {
      toast(errorMessage(cause, "İzin güncellenemedi."), "danger");
    } finally {
      setBusy(null);
    }
  }

  if (role.error) {
    return <ApiErrorPanel problem={role.error.problem} />;
  }

  if (!role.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const attachedIds = new Set(role.data.permissions.map((item) => item.id));
  const available = catalogue.data ?? role.data.permissions;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/roles"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Roller
      </Link>

      <Card className="animate-fade-up">
        <CardHeader icon={<UsersRound />} title={role.data.name} description="Rol adı" />
        <CardBody>
          {manage ? (
            <form onSubmit={submitRename} className="flex flex-wrap items-end gap-3">
              {rename.error && (
                <Alert role="alert" tone="danger" className="w-full">
                  {rename.error}
                </Alert>
              )}
              <Field
                id="role-rename"
                label="Rol adı"
                error={rename.fieldErrors.name}
                className="min-w-56 flex-1"
              >
                <Input
                  id="role-rename"
                  value={name ?? role.data.name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>
              <Button type="submit" loading={rename.pending}>
                Kaydet
              </Button>
            </form>
          ) : (
            <p className="text-sm font-medium text-fg">{role.data.name}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ShieldCheck />}
          title="Yetkiler"
          description={
            manage
              ? "Açtığınız yetki bu role hemen eklenir, kapattığınız çıkarılır."
              : "Bu rolün sahip olduğu yetkiler."
          }
        />
        <CardBody>
          {catalogue.error && (
            <Alert tone="info" className="mb-4">
              Tüm yetkilerin listesi şu an yüklenemedi; yalnızca bu role
              tanımlı olanlar gösteriliyor.
            </Alert>
          )}

          {available.length === 0 ? (
            <p className="text-sm text-subtle">Gösterilecek yetki yok.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {available.map((permission) => {
                const attached = attachedIds.has(permission.id);

                return (
                  <li
                    key={permission.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors duration-300",
                      attached ? "border-brand/30 bg-brand-soft/40" : "border-line",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {permissionLabel(permission.code)}
                      </span>
                      <span className="block truncate text-xs text-subtle">
                        {permission.code}
                      </span>
                    </span>
                    {manage ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={attached}
                        aria-label={permissionLabel(permission.code)}
                        disabled={busy !== null}
                        onClick={() => toggle(permission.id, attached)}
                        className={cn(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-60",
                          attached ? "bg-brand" : "bg-line-strong",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 grid size-5 place-items-center rounded-full bg-white shadow transition-transform duration-300 ease-spring",
                            attached && "translate-x-5",
                          )}
                        >
                          {busy === permission.id && (
                            <Spinner className="size-3 text-brand" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <Badge tone={attached ? "success" : "neutral"}>
                        {attached ? "Var" : "Yok"}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
