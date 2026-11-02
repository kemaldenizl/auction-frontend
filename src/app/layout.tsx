import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-store";
import { Toaster } from "@/shared/ui";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mezat · Canlı açık artırma",
    template: "%s · Mezat",
  },
  description:
    "Koleksiyonluk parçalar için canlı açık artırma. Teklifinizi verin, sonucu anında görün.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#07070c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script rewrites data-theme before paint, so React must accept
    // whatever it finds there during hydration.
    <html
      lang="tr"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <div aria-hidden className="aurora">
          <span />
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
