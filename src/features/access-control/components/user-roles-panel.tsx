"use client";

import { UserCog } from "lucide-react";
import { useCallback, useState } from "react";

import { useSession } from "@/features/auth/hooks/use-session";
import { PERMISSION } from "@/features/auth/model/permissions";
import { refreshIdentity } from "@/features/auth/model/session-store";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  toast,
} from "@/shared/ui";

import { rolesApi, userRolesApi } from "../api/access-control-api";

type Action = "assign" | "remove";

/**
 * Grants and revokes a role for a user.
 *
 * The backend exposes no user listing, so the target is identified by id. The
 * handiest source is a bid: every bid carries its `bidderId`, and the current
 * session's own id is on the account page.
 */
export function UserRolesPanel() {
  const { can, identity } = useSession();
  const manage = can(PERMISSION.usersManage);

  const loadRoles = useCallback(
    (signal: AbortSignal) => rolesApi.list(signal),
    [],
  );
  const roles = useAsyncData(loadRoles);

  const form = useFormSubmit();
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [action, setAction] = useState<Action>("assign");

  const apply = form.submit(async () => {
    const target = userId.trim();

    await (action === "assign"
      ? userRolesApi.assign(target, roleId)
      : userRolesApi.remove(target, roleId));

    // Changing your own roles changes what this UI may show.
    if (target === identity?.userId) await refreshIdentity();

    toast(action === "assign" ? "Rol atandı." : "Rol kaldırıldı.");
  });

  if (!manage) {
    return (
      <Alert tone="info">
        Rol atamak için “Kullanıcı rollerini yönetme” yetkisi gerekiyor.
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader
        icon={<UserCog />}
        title="Kullanıcı rolleri"
        description="Kullanıcı, üye numarasını Profilim sayfasından kopyalayıp size iletebilir."
      />
      <CardBody>
        <form onSubmit={apply} className="space-y-4">
          {form.error && (
            <Alert role="alert" tone="danger">
              {form.error}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="target-user"
              label="Üye numarası"
              error={form.fieldErrors.userid}
            >
              <Input
                id="target-user"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                required
                className="font-mono text-xs"
              />
            </Field>

            <Field id="target-role" label="Rol" error={form.fieldErrors.roleid}>
              <Select
                id="target-role"
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
                required
              >
                <option value="" disabled>
                  {roles.loading ? "Yükleniyor…" : "Rol seçin"}
                </option>
                {(roles.data ?? []).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-1 text-xs font-medium text-muted">
              İşlem
            </legend>
            {(["assign", "remove"] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="user-role-action"
                  value={value}
                  checked={action === value}
                  onChange={() => setAction(value)}
                />
                {value === "assign" ? "Rol ata" : "Rolü kaldır"}
              </label>
            ))}
          </fieldset>

          <Button
            type="submit"
            variant={action === "remove" ? "danger" : "primary"}
            loading={form.pending}
          >
            {action === "assign" ? "Rolü ata" : "Rolü kaldır"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
