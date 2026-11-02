"use client";

import { AtSign } from "lucide-react";
import { useState } from "react";

import { useSession } from "@/features/auth/hooks/use-session";
import {
  refreshIdentity,
  updateStoredUser,
} from "@/features/auth/model/session-store";
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

export function ChangeEmailForm() {
  const { user } = useSession();
  const request = useFormSubmit();
  const confirm = useFormSubmit();

  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");

  const startChange = request.submit(async () => {
    const result = await accountApi.requestEmailChange(currentPassword);
    setCode(result?.token ?? "");
    setCurrentPassword("");
  });

  const finishChange = confirm.submit(async () => {
    const value = (code ?? "").trim();
    const email = newEmail.trim();

    // Check the code before committing, so an expired one fails clearly.
    await accountApi.validateEmailChange(value);
    await accountApi.confirmEmailChange(value, email);

    // The cached account record still carries the old address; the profile
    // and the header would otherwise keep showing it.
    if (user) updateStoredUser({ ...user, email });
    await refreshIdentity();

    toast("E-posta adresiniz güncellendi.");
    setCode(null);
    setNewEmail("");
  });

  return (
    <Card className="animate-fade-up">
      <CardHeader
        icon={<AtSign />}
        title="E-posta adresi"
        description="Değişikliği mevcut adresinize gelen kodla onaylarsınız."
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
              id="email-change-password"
              label="Mevcut parolanız"
              error={request.fieldErrors.currentpassword}
            >
              <PasswordInput
                id="email-change-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" variant="secondary" loading={request.pending}>
              Devam et
            </Button>
          </form>
        ) : (
          <form onSubmit={finishChange} className="animate-fade-up space-y-4">
            <Alert tone="info">
              E-postanıza bir doğrulama kodu gönderdik. Kodu ve yeni adresinizi
              girin.
            </Alert>
            {confirm.error && (
              <Alert role="alert" tone="danger">
                {confirm.error}
              </Alert>
            )}

            <Field id="email-code" label="Doğrulama kodu" error={confirm.fieldErrors.token}>
              <Input
                id="email-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="one-time-code"
                required
              />
            </Field>

            <Field id="new-email" label="Yeni e-posta adresi" error={confirm.fieldErrors.newemail}>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="email"
                placeholder="yeni@eposta.com"
                required
              />
            </Field>

            <div className="flex gap-2">
              <Button type="submit" loading={confirm.pending}>
                E-postayı güncelle
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
