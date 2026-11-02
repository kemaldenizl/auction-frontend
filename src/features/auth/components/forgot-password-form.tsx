"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import { Button, EmptyState, Field, Input } from "@/shared/ui";

import { authApi } from "../api/auth-api";
import { AuthCard } from "./auth-card";

export function ForgotPasswordForm() {
  const form = useFormSubmit();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const request = form.submit(async () => {
    await authApi.forgotPassword(email.trim());
    setSent(true);
  });

  return (
    <AuthCard
      title="Parolanızı mı unuttunuz?"
      description="E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim."
      error={form.error}
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Girişe dön
        </Link>
      }
    >
      {sent ? (
        // The same answer whether or not the address exists: saying "not
        // registered" would reveal who has an account here.
        <EmptyState
          icon={<MailCheck />}
          title="E-postanızı kontrol edin"
          description="Bu adres kayıtlıysa birkaç dakika içinde bir sıfırlama bağlantısı alacaksınız."
        />
      ) : (
        <form onSubmit={request} className="space-y-4">
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

          <Button type="submit" size="lg" loading={form.pending} className="w-full">
            Bağlantı gönder
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
