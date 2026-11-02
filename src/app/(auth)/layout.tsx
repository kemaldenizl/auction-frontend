import { Clock, ShieldCheck, Zap } from "lucide-react";

import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { stagger } from "@/shared/ui";

import { BrandMark } from "../_components/brand-mark";

const HIGHLIGHTS = [
  { Icon: Zap, title: "Anında güncellenir", text: "Yeni teklifler sayfayı yenilemeden ekrana düşer." },
  { Icon: Clock, title: "Saniyesi saniyesine", text: "Geri sayım sunucu saatine göre işler." },
  { Icon: ShieldCheck, title: "Güvende", text: "İki adımlı doğrulama ile hesabınızı koruyun." },
];

/** Split screen: the form on one side, a moving brand panel on the other. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid flex-1 lg:grid-cols-[1fr_1.05fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <BrandMark />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          {children}
        </div>
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-3 overflow-hidden rounded-[2rem] bg-gradient-brand bg-[length:200%_200%] animate-gradient-pan">
          {/* Soft light blobs drifting over the gradient. */}
          <div className="absolute -top-24 -left-24 size-96 animate-float rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -right-16 bottom-0 size-80 animate-float rounded-full bg-black/20 blur-3xl [animation-delay:-3s]" />

          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Canlı açık artırma
            </p>
            <h2 className="mt-3 max-w-md text-4xl leading-tight font-semibold tracking-tight">
              Her teklif, gerçek zamanlı.
            </h2>

            <ul className="mt-10 grid gap-4">
              {HIGHLIGHTS.map(({ Icon, title, text }, index) => (
                <li
                  key={title}
                  className="flex animate-fade-up items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md stagger"
                  style={stagger(index + 2, 120)}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/20">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-white/75">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </main>
  );
}
