import { Suspense } from "react";

import { SessionMenu } from "@/features/auth/components/session-menu";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Container } from "@/shared/ui";

import { BrandMark } from "./brand-mark";
import { MainNav, MainNavFallback } from "./main-nav";

function Navigation() {
  // The active-link highlight reads the URL, so it streams in behind its own
  // boundary rather than blocking the route.
  return (
    <Suspense fallback={<MainNavFallback />}>
      <MainNav />
    </Suspense>
  );
}

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-20 border-b border-line/70">
      <Container className="flex h-16 items-center gap-6">
        <BrandMark />

        <div className="hidden md:block">
          <Navigation />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <SessionMenu />
        </div>
      </Container>

      {/* On narrow screens the links move to their own scrollable row. */}
      <Container className="flex items-center justify-between gap-2 overflow-x-auto pb-3 md:hidden">
        <Navigation />
        <ThemeToggle className="sm:hidden" />
      </Container>
    </header>
  );
}
