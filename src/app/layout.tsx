import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Container } from "@/shared/ui";

import { SiteHeader } from "./_components/site-header";
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
    default: "Mezat · Canlı açık arttırma",
    template: "%s · Mezat",
  },
  description:
    "SignalR üzerinden canlı teklif akışı: katalog ve açık arttırma servislerinin frontend'i.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1 py-8">
          <Container>{children}</Container>
        </main>
        <footer className="border-t border-line py-6">
          <Container>
            <p className="text-xs text-subtle">
              Teklifler hub üzerinden gönderilir, sonuç olay olarak döner.
              Fiyatın kaynağı sunucudur.
            </p>
          </Container>
        </footer>
      </body>
    </html>
  );
}
