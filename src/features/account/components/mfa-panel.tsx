"use client";

import { RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { mfaApi } from "@/features/auth/api/mfa-api";
import type { MfaSetup } from "@/features/auth/model/auth";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  Field,
  Input,
  toast,
} from "@/shared/ui";

function RecoveryCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  return (
    <div className="space-y-3">
      <Alert tone="warning" title="Bu kodlar bir daha gösterilmeyecek">
        Telefonunuza erişemediğinizde giriş yapmanın tek yolu bunlar. Güvenli
        bir yere kaydedin.
      </Alert>

      <ul className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-muted p-3 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="tabular">
            {code}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <CopyButton value={codes.join("\n")} label="Tümünü kopyala" />
        <Button variant="ghost" size="sm" onClick={onDone}>
          Kaydettim
        </Button>
      </div>
    </div>
  );
}

/**
 * TOTP setup, disable and recovery-code rotation.
 *
 * The backend exposes no "is MFA on?" endpoint, so this panel offers the
 * actions rather than reflecting a state: the server rejects whichever one
 * does not apply.
 */
export function MfaPanel() {
  const setup = useFormSubmit();
  const complete = useFormSubmit();
  const disable = useFormSubmit();
  const rotate = useFormSubmit();

  const [enrolment, setEnrolment] = useState<MfaSetup | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [rotateCode, setRotateCode] = useState("");

  const begin = setup.submit(async () => {
    setEnrolment(await mfaApi.beginSetup());
    setRecoveryCodes(null);
  });

  const finish = complete.submit(async () => {
    const { recoveryCodes: codes } = await mfaApi.completeSetup(
      setupCode.trim(),
    );
    setRecoveryCodes(codes);
    setEnrolment(null);
    setSetupCode("");
    toast("İki adımlı doğrulama açıldı.");
  });

  const turnOff = disable.submit(async () => {
    await mfaApi.disable({ totpCode: disableCode.trim() });
    setDisableCode("");
    toast("İki adımlı doğrulama kapatıldı.");
  });

  const regenerate = rotate.submit(async () => {
    const { recoveryCodes: codes } = await mfaApi.regenerateRecoveryCodes(
      rotateCode.trim(),
    );
    setRecoveryCodes(codes);
    setRotateCode("");
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="İki adımlı doğrulama"
          icon={<ShieldCheck />}
          description="Girişte parolanızın yanında telefonunuzdaki kodu da isteyerek hesabınızı koruyun."
        />
        <CardBody className="space-y-4">
          {recoveryCodes ? (
            <RecoveryCodes
              codes={recoveryCodes}
              onDone={() => setRecoveryCodes(null)}
            />
          ) : enrolment ? (
            <form onSubmit={finish} className="space-y-4">
              <div className="flex flex-wrap items-start gap-4">
                {/* Rendered locally — the secret never leaves the browser. */}
                <div className="rounded-lg bg-white p-3">
                  <QRCodeSVG value={enrolment.otpAuthUri} size={148} />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm text-muted">
                    Uygulamanızla kodu okutun ya da anahtarı elle girin.
                  </p>
                  <p className="break-all rounded-lg border border-line bg-surface-muted p-2 font-mono text-xs">
                    {enrolment.manualEntryKey}
                  </p>
                  <CopyButton value={enrolment.manualEntryKey} label="Anahtarı kopyala" />
                </div>
              </div>

              {complete.error && (
                <Alert role="alert" tone="danger">
                  {complete.error}
                </Alert>
              )}

              <Field
                id="mfa-setup-code"
                label="Uygulamadaki kod"
                hint="Kurulumu bitirmek için 6 haneli kodu girin."
                error={complete.fieldErrors.code}
              >
                <Input
                  id="mfa-setup-code"
                  value={setupCode}
                  onChange={(event) => setSetupCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="tabular tracking-widest"
                />
              </Field>

              <div className="flex gap-2">
                <Button type="submit" loading={complete.pending}>
                  Kurulumu bitir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEnrolment(null)}
                >
                  Vazgeç
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={begin} className="space-y-3">
              {setup.error && (
                <Alert role="alert" tone="danger">
                  {setup.error}
                </Alert>
              )}
              <Button type="submit" loading={setup.pending}>
                Kurulumu başlat
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<RefreshCw />}
          title="Kurtarma kodlarını yenile"
          description="Yeni kodlar oluşturulur, eskileri artık çalışmaz."
        />
        <CardBody>
          <form onSubmit={regenerate} className="space-y-3">
            {rotate.error && (
              <Alert role="alert" tone="danger">
                {rotate.error}
              </Alert>
            )}
            <Field
              id="mfa-rotate-code"
              label="Doğrulama kodu"
              error={rotate.fieldErrors.totpcode}
            >
              <Input
                id="mfa-rotate-code"
                value={rotateCode}
                onChange={(event) => setRotateCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                required
                className="tabular tracking-widest"
              />
            </Field>
            <Button type="submit" variant="secondary" loading={rotate.pending}>
              Yeni kodlar üret
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ShieldOff />}
          title="İki adımlı doğrulamayı kapat"
          description="Kapatırsanız giriş için yalnızca parolanız yeterli olur."
        />
        <CardBody>
          <form onSubmit={turnOff} className="space-y-3">
            {disable.error && (
              <Alert role="alert" tone="danger">
                {disable.error}
              </Alert>
            )}
            <Field
              id="mfa-disable-code"
              label="Doğrulama kodu"
              error={disable.fieldErrors.totpcode}
            >
              <Input
                id="mfa-disable-code"
                value={disableCode}
                onChange={(event) => setDisableCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                required
                className="tabular tracking-widest"
              />
            </Field>
            <Button type="submit" variant="danger" loading={disable.pending}>
              Kapat
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
