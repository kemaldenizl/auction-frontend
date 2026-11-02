"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import { Button, Field, Input, PasswordInput } from "@/shared/ui";

import { authApi } from "../api/auth-api";
import { useSession } from "../hooks/use-session";
import type { AuthTokens, AuthUser, MfaChallenge } from "../model/auth";
import { signIn } from "../model/session-store";
import { AuthCard } from "./auth-card";
import { MfaChallengeForm } from "./mfa-challenge-form";

interface Challenge {
  challenge: MfaChallenge;
  user: AuthUser;
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const form = useFormSubmit();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingMfa, setPendingMfa] = useState<Challenge | null>(null);

  // Someone already signed in has no business on this screen.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function completeSignIn(tokens: AuthTokens, user: AuthUser) {
    await signIn(tokens, user);
    router.replace(next);
  }

  const login = form.submit(async () => {
    const result = await authApi.login({ email: email.trim(), password });

    // Branch on `requiresMfa`, not on whether tokens look present.
    if (result.requiresMfa && result.mfaChallenge) {
      setPendingMfa({ challenge: result.mfaChallenge, user: result.user });
      return;
    }

    // Not expected outside an MFA challenge; shown as a generic failure.
    if (!result.tokens) throw new Error("login returned no tokens");

    await completeSignIn(result.tokens, result.user);
  });

  if (pendingMfa) {
    return (
      <AuthCard
        title="İki adımlı doğrulama"
        description={`${pendingMfa.user.email} hesabı için doğrulama kodunu girin.`}
      >
        <MfaChallengeForm
          challenge={pendingMfa.challenge}
          onVerified={(tokens) => completeSignIn(tokens, pendingMfa.user)}
          onCancel={() => setPendingMfa(null)}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Tekrar hoş geldiniz"
      description="Teklif vermek ve hesabınızı yönetmek için giriş yapın."
      error={form.error}
      footer={
        <>
          Hesabınız yok mu?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Hemen kayıt olun
          </Link>
        </>
      }
    >
      <form onSubmit={login} className="space-y-4">
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
            autoComplete="current-password"
            required
          />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-muted transition-colors hover:text-brand"
          >
            Parolamı unuttum
          </Link>
        </div>

        {/* Locked while pending: a double click would burn two of the five
            sign-in attempts a minute the server allows. */}
        <Button type="submit" size="lg" loading={form.pending} className="w-full">
          Giriş yap
          {!form.pending && <ArrowRight />}
        </Button>
      </form>
    </AuthCard>
  );
}
