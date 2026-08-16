import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "slang-theme";

type Theme = "default" | "light";

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.dataset["theme"] = "light";
  } else {
    delete document.documentElement.dataset["theme"];
  }
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const current = document.documentElement.dataset["theme"] === "light" ? "light" : "default";
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "default" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Dark theme" : "Light theme"}
      className={cn(
        "fixed right-5 bottom-5 z-50 grid size-11 place-items-center rounded-full border border-hairline bg-surface/90 text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:text-foreground",
        !mounted && "opacity-0",
      )}
    >
      {theme === "light" ? (
        <Sun className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
