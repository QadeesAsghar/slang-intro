import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFrame } from "./ProductFrame";
import { DashboardMock } from "./DashboardMock";
import { RevealText } from "./RevealText";
import { useMagnetic } from "@/hooks/use-magnetic";

export function Hero() {
  const [mounted, setMounted] = useState(false);
  const [offset, setOffset] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const node = frameRef.current;
        if (!node) return;
        const progress = Math.min(1, Math.max(0, window.scrollY / 900));
        setOffset(progress);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[620px]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, color-mix(in oklab, var(--violet) 26%, transparent), transparent 70%), radial-gradient(45% 40% at 78% 12%, color-mix(in oklab, var(--blue) 18%, transparent), transparent 70%)",
          opacity: 0.7 * (1 - offset * 0.6),
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <RevealText
            as="h1"
            text="Every customer conversation, in one place."
            className="text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl lg:text-6xl"
            stagger={55}
          />
          <p
            className="mx-auto mt-6 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(18px)",
              transition: "opacity .8s ease .4s, transform .8s cubic-bezier(.16,1,.3,1) .4s",
            }}
          >
            Slang is a customer communication platform. Live chat on your website, customer context,
            team workflows and analytics, running as one system.
          </p>
          <div
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity .8s ease .56s",
            }}
          >
            <Button size="lg" asChild>
              <Link ref={ctaRef} to="/waitlist" className="group">
                Join Waitlist
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-hairline bg-surface/60">
              <a href="#connect">Get connected</a>
            </Button>
          </div>
        </div>

        <div
          ref={frameRef}
          className="mt-16 [perspective:2000px] lg:mt-20"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 1.1s ease .7s",
          }}
        >
          <ProductFrame priority interactive label="slang.app" className="mx-auto max-w-6xl">
            <DashboardMock />
          </ProductFrame>
          <div
            aria-hidden="true"
            className="pointer-events-none relative mx-auto -mt-32 h-32 max-w-6xl"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--background) 30%, transparent), var(--background))",
              transform: `translateY(${offset * -20}px)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
