"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-14 h-7" />;
  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative flex items-center w-14 h-7 rounded-full p-0.5
        transition-all duration-300 ease-in-out cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${isDark
          ? "bg-slate-700 border border-slate-600 focus-visible:ring-cyan-400"
          : "bg-orange-100 border border-orange-200 focus-visible:ring-orange-400"
        }
      `}
    >
      {/* Icons on the track */}
      <Sun className="absolute left-1.5 w-3.5 h-3.5 text-orange-400 transition-opacity duration-200"
        style={{ opacity: isDark ? 0.3 : 1 }}
      />
      <Moon className="absolute right-1.5 w-3.5 h-3.5 text-cyan-400 transition-opacity duration-200"
        style={{ opacity: isDark ? 1 : 0.3 }}
      />

      {/* Sliding thumb */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={`
          relative z-10 w-6 h-6 rounded-full shadow-md flex items-center justify-center
          ${isDark
            ? "bg-slate-900 ml-auto shadow-[0_0_8px_rgba(34,211,238,0.4)]"
            : "bg-white mr-auto shadow-[0_0_8px_rgba(249,115,22,0.3)]"
          }
        `}
      >
        {isDark
          ? <Moon className="w-3 h-3 text-cyan-400" />
          : <Sun className="w-3 h-3 text-orange-500" />
        }
      </motion.span>
    </button>
  );
}
