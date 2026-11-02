"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";

import { PasswordChecklist } from "@/features/auth/components/password-checklist";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "@/features/auth/model/password";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PasswordInput,
  toast,
} from "@/shared/ui";

import { accountApi } from "../api/account-api";
import { StepIndicator } from "./step-indicator";

export function ChangePasswordForm() {
  const request = useFormSubmit();
  const confirm = useFormSubmit();

  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const startChange = request.submit(async () => {
    const result = await accountApi.requestPasswordChange(currentPassword);
    // Prefilled when the deployment hands the code back directly; otherwise
    // the user copies it from the e-mail.
    setCode(result?.token ?? "");
    setCurrentPassword("");
  });

  const finishChange = confirm.submit(async () => {
    const problem =
      validatePassword(newPassword) ??
      validatePasswordConfirmation(newPassword, confirmation);

    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);

    await accountApi.confirmPasswordChange((code ?? "").trim(), newPassword);
    toast("Parolanız güncellendi.");
    setCode(null);
    setNewPassword("");
    setConfirmation("");
  });

  return (
    <Card className="animate-fade-up">
      <CardHeader
        icon={<KeyRound />}
        title="Parola"
        description="Güvenliğiniz için değişikliği e-postanıza gelen kodla onaylarsınız."
        action={<StepIndicator step={code === null ? 1 : 2} total={2} />}
      />
      <CardBody>
        {code === null ? (
          <form onSubmit={startChange} className="space-y-4">
            {request.error && (
              <Alert role="alert" tone="danger">
                {request.error}
              </Alert>
            )}
            <Field
              id="current-password"
              label="Mevcut parolanız"
              error={request.fieldErrors.currentpassword}
            >
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" loading={request.pending}>
              Devam et
            </Button>
          </form>
        ) : (
          <form onSubmit={finishChange} className="animate-fade-up space-y-4">
            <Alert tone="info">
              E-postanıza bir doğrulama kodu gönderdik. Kodu girip yeni
              parolanızı belirleyin.
            </Alert>
            {(localError ?? confirm.error) && (
              <Alert role="alert" tone="danger">
                {localError ?? confirm.error}
              </Alert>
            )}

            <Field
              id="password-code"
              label="Doğrulama kodu"
              error={confirm.fieldErrors.token}
            >
              <Input
                id="password-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="one-time-code"
                required
              />
            </Field>

            <Field
              id="account-new-password"
              label="Yeni parola"
              error={confirm.fieldErrors.newpassword}
            >
              <PasswordInput
                id="account-new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>

            <PasswordChecklist password={newPassword} />

            <Field id="account-new-password-confirm" label="Yeni parola (tekrar)">
              <PasswordInput
                id="account-new-password-confirm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>

            <div className="flex gap-2">
              <Button type="submit" loading={confirm.pending}>
                Parolayı güncelle
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCode(null)}>
                Vazgeç
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
