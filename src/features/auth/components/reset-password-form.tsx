"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  Button,
  Field,
  PasswordInput,
  buttonClassName,
  toast,
} from "@/shared/ui";

import { authApi } from "../api/auth-api";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "../model/password";
import { AuthCard } from "./auth-card";
import { PasswordChecklist } from "./password-checklist";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const form = useFormSubmit();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = form.submit(async () => {
    if (!token) return;

    const problem =
      validatePassword(password) ??
      validatePasswordConfirmation(password, confirmation);

    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);

    await authApi.resetPassword(token, password);
    toast("Parolanız güncellendi, giriş yapabilirsiniz.");
    router.replace("/login");
  });

  if (!token) {
    return (
      <AuthCard title="Bağlantı geçersiz">
        <Alert role="alert" tone="danger">
          Bu sıfırlama bağlantısı eksik ya da süresi dolmuş. E-postadaki
          bağlantıyı olduğu gibi açın ya da yeni bir tane isteyin.
        </Alert>
        <Link href="/forgot-password" className={buttonClassName({ className: "w-full" })}>
          Yeni bağlantı iste
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Yeni parola belirleyin"
      description="Hesabınız için güçlü bir parola seçin."
      error={localError ?? form.error}
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Girişe dön
        </Link>
      }
    >
      <form onSubmit={reset} className="space-y-4">
        <Field
          id="new-password"
          label="Yeni parola"
          error={form.fieldErrors.newpassword ?? form.fieldErrors.password}
        >
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            autoFocus
          />
        </Field>

        <PasswordChecklist password={password} />

        <Field id="new-password-confirm" label="Yeni parola (tekrar)">
          <PasswordInput
            id="new-password-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" size="lg" loading={form.pending} className="w-full">
          Parolayı güncelle
        </Button>
      </form>
    </AuthCard>
  );
}
