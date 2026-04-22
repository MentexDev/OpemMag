"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-xl transition-all duration-300 border backdrop-blur-md
        bg-white/90 border-neutral-200 text-neutral-700 hover:border-pink-300 hover:bg-pink-50
        dark:bg-neutral-900/90 dark:border-white/10 dark:text-white dark:hover:border-pink-500/40 dark:hover:bg-pink-500/10"
      aria-label="Cambiar tema"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-yellow-500" />
          <span className="text-xs">Modo claro</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-purple-500" />
          <span className="text-xs">Modo oscuro</span>
        </>
      )}
    </button>
  );
}
