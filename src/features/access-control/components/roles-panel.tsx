"use client";

import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { useSession } from "@/features/auth/hooks/use-session";
import type { Role } from "@/features/auth/model/auth";
import { PERMISSION, permissionLabel } from "@/features/auth/model/permissions";
import { errorMessage } from "@/shared/api";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  ApiErrorPanel,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  buttonClassName,
  toast,
} from "@/shared/ui";

import { rolesApi } from "../api/access-control-api";

export function RolesPanel() {
  const { can } = useSession();
  const manage = can(PERMISSION.rolesManage);

  const load = useCallback((signal: AbortSignal) => rolesApi.list(signal), []);
  const { data, error, loading, reload } = useAsyncData(load);

  const form = useFormSubmit();
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [pending, setPending] = useState(false);

  const create = form.submit(async () => {
    await rolesApi.create(name.trim());
    setName("");
    toast("Rol oluşturuldu.");
    reload();
  });

  async function remove() {
    if (!deleting) return;
    setPending(true);

    try {
      await rolesApi.remove(deleting.id);
      toast("Rol silindi.");
      reload();
    } catch (cause) {
      toast(errorMessage(cause, "Rol silinemedi."), "danger");
    } finally {
      setPending(false);
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {manage && (
        <Card>
          <CardHeader icon={<Plus />} title="Yeni rol" description="Oluşturduktan sonra yetkilerini seçebilirsiniz." />
          <CardBody>
            <form onSubmit={create} className="flex flex-wrap items-end gap-3">
              {form.error && (
                <Alert role="alert" tone="danger" className="w-full">
                  {form.error}
                </Alert>
              )}
              <Field
                id="role-name"
                label="Rol adı"
                error={form.fieldErrors.name}
                className="min-w-56 flex-1"
              >
                <Input
                  id="role-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="ör. Moderatör"
                  required
                />
              </Field>
              <Button type="submit" loading={form.pending}>
                Oluştur
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<UsersRound />}
          title="Roller"
          description="Her rol bir yetki kümesidir; kullanıcılar rolleri üzerinden yetkilenir."
        />
        <CardBody className="p-0">
          {error ? (
            <div className="p-4">
              <ApiErrorPanel problem={error.problem} />
            </div>
          ) : loading && !data ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <Table caption="Roller">
              <TableHead>
                <TableRow>
                  <TableHeader>Rol</TableHeader>
                  <TableHeader>İzinler</TableHeader>
                  <TableHeader className="text-right">İşlem</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data && data.length > 0 ? (
                  data.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Link
                          href={`/admin/roles/${role.id}`}
                          className="font-medium text-fg hover:text-brand"
                        >
                          {role.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {role.permissions.length === 0 ? (
                          <span className="text-subtle">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission) => (
                              <Badge key={permission.id} tone="neutral">
                                {permissionLabel(permission.code)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Link
                          href={`/admin/roles/${role.id}`}
                          className={buttonClassName({ variant: "ghost", size: "sm" })}
                        >
                          <Pencil /> Düzenle
                        </Link>
                        {manage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(role)}
                          >
                            <Trash2 /> Sil
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={3}>Henüz rol yok.</TableEmpty>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        title={`“${deleting?.name}” rolü silinsin mi?`}
        description="Bu role sahip kullanıcılar ilgili yetkileri kaybeder."
        confirmLabel="Sil"
        destructive
        pending={pending}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
