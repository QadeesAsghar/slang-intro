import { useEffect, useState } from "react";
import { Sparkles, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "slang-theme";

type Theme = "default" | "ocean";

function applyTheme(theme: Theme) {
  if (theme === "ocean") {
    document.documentElement.dataset["theme"] = "ocean";
  } else {
    delete document.documentElement.dataset["theme"];
  }
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const current = document.documentElement.dataset["theme"] === "ocean" ? "ocean" : "default";
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "ocean" ? "default" : "ocean";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "ocean" ? "Switch to default theme" : "Switch to ocean theme"}
      title={theme === "ocean" ? "Default theme" : "Ocean theme"}
      className={cn(
        "fixed right-5 bottom-5 z-50 grid size-11 place-items-center rounded-full border border-hairline bg-surface/90 text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:text-foreground",
        !mounted && "opacity-0",
      )}
    >
      {theme === "ocean" ? (
        <Waves className="size-[18px]" aria-hidden="true" />
      ) : (
        <Sparkles className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
