"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import { Input } from "./field";

export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((previous) => !previous)}
        aria-pressed={visible}
        aria-label={visible ? "Parolayı gizle" : "Parolayı göster"}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-subtle transition-colors hover:text-fg"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
