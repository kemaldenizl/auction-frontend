"use client";

import { useState } from "react";

import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import { Alert, Button, Field, Input } from "@/shared/ui";

import { mfaApi } from "../api/mfa-api";
import type { AuthTokens, MfaChallenge } from "../model/auth";

type Method = "totp" | "recovery";

/**
 * Second step of a login where MFA is on: the first call returned no tokens,
 * only a short-lived challenge to exchange for them.
 */
export function MfaChallengeForm({
  challenge,
  onVerified,
  onCancel,
}: {
  challenge: MfaChallenge;
  onVerified: (tokens: AuthTokens) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useFormSubmit();
  const [method, setMethod] = useState<Method>("totp");
  const [code, setCode] = useState("");

  const verify = form.submit(async () => {
    const { tokens } = await mfaApi.completeLogin({
      challengeToken: challenge.challengeToken,
      totpCode: method === "totp" ? code.trim() : null,
      recoveryCode: method === "recovery" ? code.trim() : null,
    });
    await onVerified(tokens);
  });

  const isTotp = method === "totp";

  return (
    <form onSubmit={verify} className="space-y-4">
      {form.error && (
        <Alert role="alert" tone="danger">
          {form.error}
        </Alert>
      )}

      <Field
        id="mfa-code"
        label={isTotp ? "Doğrulama kodu" : "Kurtarma kodu"}
        hint={
          isTotp
            ? "Kimlik doğrulayıcı uygulamanızdaki 6 haneli kod."
            : "Kurulum sırasında kaydettiğiniz tek kullanımlık kodlardan biri."
        }
        error={form.fieldErrors.totpcode ?? form.fieldErrors.recoverycode}
      >
        <Input
          id="mfa-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="one-time-code"
          inputMode={isTotp ? "numeric" : "text"}
          maxLength={isTotp ? 6 : undefined}
          autoFocus
          required
          className="h-14 text-center text-xl font-semibold tabular tracking-[0.4em]"
        />
      </Field>

      <Button type="submit" size="lg" loading={form.pending} className="w-full">
        Doğrula
      </Button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          className="text-muted underline-offset-2 hover:text-fg hover:underline"
          onClick={() => {
            setMethod(isTotp ? "recovery" : "totp");
            setCode("");
            form.reset();
          }}
        >
          {isTotp ? "Kurtarma kodu kullan" : "Doğrulama kodu kullan"}
        </button>
        <button
          type="button"
          className="text-muted underline-offset-2 hover:text-fg hover:underline"
          onClick={onCancel}
        >
          Geri dön
        </button>
      </div>
    </form>
  );
}
