"use client";

import { BadgeCheck, MailCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { errorMessage } from "@/shared/api";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Spinner,
  buttonClassName,
} from "@/shared/ui";

import { authApi } from "../api/auth-api";
import { AuthCard } from "./auth-card";

function ResendForm() {
  const form = useFormSubmit();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const resend = form.submit(async () => {
    await authApi.resendVerification(email.trim());
    setSent(true);
  });

  if (sent) {
    return (
      <EmptyState
        icon={<MailCheck />}
        title="Bağlantı yolda"
        description="Bu adres kayıtlı ve henüz doğrulanmamışsa yeni bir bağlantı gönderdik."
      />
    );
  }

  return (
    <form onSubmit={resend} className="space-y-4">
      <Field
        id="resend-email"
        label="E-posta"
        hint="Doğrulama bağlantısını yeniden gönderelim."
        error={form.fieldErrors.email ?? form.error}
      >
        <Input
          id="resend-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="ornek@eposta.com"
          required
        />
      </Field>
      <Button
        type="submit"
        variant="secondary"
        size="lg"
        loading={form.pending}
        className="w-full"
      >
        Yeniden gönder
      </Button>
    </form>
  );
}

export function VerifyEmailPanel({ token }: { token: string | null }) {
  const verify = useCallback(async () => {
    if (!token) return null;
    await authApi.verifyEmail(token);
    return true;
  }, [token]);

  const { data, error, loading } = useAsyncData(verify);

  if (token && loading) {
    return (
      <AuthCard title="E-postanız doğrulanıyor">
        <div className="flex justify-center py-8 text-brand">
          <Spinner label="Doğrulanıyor" className="size-8" />
        </div>
      </AuthCard>
    );
  }

  if (data) {
    return (
      <AuthCard title="Hazırsınız!">
        <EmptyState
          icon={<BadgeCheck />}
          title="E-posta adresiniz doğrulandı"
          description="Artık tüm özellikleri kullanabilirsiniz."
          action={
            <Link href="/" className={buttonClassName()}>
              Açık artırmalara git
            </Link>
          }
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="E-posta doğrulama"
      description={
        token
          ? undefined
          : "Doğrulama bağlantısı eksik görünüyor. Yeni bir bağlantı isteyebilirsiniz."
      }
      error={
        error
          ? errorMessage(
              error,
              "Bu doğrulama bağlantısı geçersiz ya da süresi dolmuş.",
            )
          : null
      }
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Girişe dön
        </Link>
      }
    >
      <ResendForm />
    </AuthCard>
  );
}
