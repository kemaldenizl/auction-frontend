"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button, type ButtonSize, type ButtonVariant } from "./button";

export function CopyButton({
  value,
  label = "Kopyala",
  copiedLabel = "Kopyalandı",
  variant = "secondary",
  size = "sm",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard access can be refused; the value stays selectable on screen.
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={copy}>
      {copied ? (
        <Check className="animate-scale-in text-success" />
      ) : (
        <Copy />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}
