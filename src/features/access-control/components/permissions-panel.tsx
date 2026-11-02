"use client";

import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { useSession } from "@/features/auth/hooks/use-session";
import type { Permission } from "@/features/auth/model/auth";
import { PERMISSION, permissionLabel } from "@/features/auth/model/permissions";
import { errorMessage } from "@/shared/api";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  ApiErrorPanel,
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
  toast,
} from "@/shared/ui";

import { permissionsApi } from "../api/access-control-api";

export function PermissionsPanel() {
  const { can } = useSession();
  const manage = can(PERMISSION.permissionsManage);

  const load = useCallback(
    (signal: AbortSignal) => permissionsApi.list(signal),
    [],
  );
  const { data, error, loading, reload } = useAsyncData(load);

  const form = useFormSubmit();
  const [code, setCode] = useState("");
  const [deleting, setDeleting] = useState<Permission | null>(null);
  const [pending, setPending] = useState(false);

  const create = form.submit(async () => {
    await permissionsApi.create(code.trim());
    setCode("");
    toast("Yetki eklendi.");
    reload();
  });

  async function remove() {
    if (!deleting) return;
    setPending(true);

    try {
      await permissionsApi.remove(deleting.id);
      toast("Yetki silindi.");
      reload();
    } catch (cause) {
      toast(errorMessage(cause, "Yetki silinemedi."), "danger");
    } finally {
      setPending(false);
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <Alert tone="info">
        Yeni eklediğiniz bir yetki, sistemde karşılığı tanımlanana kadar bir
        işlevi açmaz. Bu ekran mevcut yetkileri görmek ve rollere dağıtmak
        içindir.
      </Alert>

      {manage && (
        <Card>
          <CardHeader icon={<Plus />} title="Yeni yetki" />
          <CardBody>
            <form onSubmit={create} className="flex flex-wrap items-end gap-3">
              {form.error && (
                <Alert role="alert" tone="danger" className="w-full">
                  {form.error}
                </Alert>
              )}
              <Field
                id="permission-code"
                label="Yetki kodu"
                hint="Örnek: raporlar.okuma"
                error={form.fieldErrors.code}
                className="min-w-56 flex-1"
              >
                <Input
                  id="permission-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="reports.read"
                  required
                  className="font-mono"
                />
              </Field>
              <Button type="submit" loading={form.pending}>
                Ekle
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader icon={<ShieldCheck />} title="Yetkiler" description="Sistemde tanımlı tüm yetkiler." />
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
            <Table caption="Yetkiler">
              <TableHead>
                <TableRow>
                  <TableHeader>Yetki</TableHeader>
                  <TableHeader>Kod</TableHeader>
                  {manage && (
                    <TableHeader className="text-right">İşlem</TableHeader>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data && data.length > 0 ? (
                  data.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium text-fg">
                        {permissionLabel(permission.code)}
                      </TableCell>
                      <TableCell className="text-xs text-subtle">
                        {permission.code}
                      </TableCell>
                      {manage && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(permission)}
                          >
                            <Trash2 /> Sil
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={manage ? 3 : 2}>
                    Tanımlı yetki yok.
                  </TableEmpty>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        title={`“${deleting ? permissionLabel(deleting.code) : ""}” yetkisi silinsin mi?`}
        description="Bu yetkiye sahip roller onu kaybeder."
        confirmLabel="Sil"
        destructive
        pending={pending}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
