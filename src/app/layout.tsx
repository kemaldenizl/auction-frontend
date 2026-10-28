import type { Metadata } from "next";

import { Container } from "@/shared/ui";

import { SiteHeader } from "./_components/site-header";
import "./globals.css";

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
      className={`h-full antialiased`}
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
