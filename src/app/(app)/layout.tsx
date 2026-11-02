import { Container } from "@/shared/ui";

import { BrandMark } from "../_components/brand-mark";
import { SiteHeader } from "../_components/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-10">
        <Container>{children}</Container>
      </main>
      <footer className="border-t border-line/70">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-8">
          <BrandMark className="opacity-80" />
          <p className="text-xs text-subtle">
            Koleksiyonluk parçalar için canlı açık artırma
          </p>
        </Container>
      </footer>
    </>
  );
}
