import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled && "border-b border-hairline bg-background/80 backdrop-blur-xl",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"
      >
        <a href="#top" className="flex items-center gap-2.5" aria-label="Slang home">
          <img src="/favicon.png" alt="" className="size-8 rounded-lg object-cover" />
          <span className="font-display text-[15px] font-semibold tracking-tight">slang</span>
        </a>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href="#connect">Connect</a>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
            <a
              href="https://github.com/QadeesAsghar"
              target="_blank"
              rel="noreferrer"
              aria-label="Slang on GitHub"
            >
              <Github />
            </a>
          </Button>
        </div>
      </nav>
    </header>
  );
}
