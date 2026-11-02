"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import { Button, Field, Input, PasswordInput } from "@/shared/ui";

import { authApi } from "../api/auth-api";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "../model/password";
import { signIn } from "../model/session-store";
import { AuthCard } from "./auth-card";
import { PasswordChecklist } from "./password-checklist";

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const form = useFormSubmit();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const register = form.submit(async () => {
    // Checked here so an obviously invalid password does not spend one of the
    // five requests a minute this endpoint allows.
    const problem =
      validatePassword(password) ??
      validatePasswordConfirmation(password, confirmation);

    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);

    const credentials = { email: email.trim(), password };
    const { user } = await authApi.register(credentials);

    // Registering creates the account but does not sign in, so do it next.
    const result = await authApi.login(credentials);
    if (!result.tokens) {
      router.replace("/login");
      return;
    }

    await signIn(result.tokens, result.user ?? user);
    router.replace(next);
  });

  return (
    <AuthCard
      title="Hesap oluşturun"
      description="Birkaç saniye sürer. Kayıt olur olmaz teklif verebilirsiniz."
      error={localError ?? form.error}
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Giriş yapın
          </Link>
        </>
      }
    >
      <form onSubmit={register} className="space-y-4">
        <Field id="email" label="E-posta" error={form.fieldErrors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="ornek@eposta.com"
            required
            autoFocus
          />
        </Field>

        <Field id="password" label="Parola" error={form.fieldErrors.password}>
          <PasswordInput
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <PasswordChecklist password={password} />

        <Field id="password-confirm" label="Parola (tekrar)">
          <PasswordInput
            id="password-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" size="lg" loading={form.pending} className="w-full">
          Hesap oluştur
          {!form.pending && <ArrowRight />}
        </Button>
      </form>
    </AuthCard>
  );
}
