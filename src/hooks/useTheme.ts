import { useState, useEffect, useCallback } from "react"

export type Theme = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

const THEME_STORAGE_KEY = "portfolio-theme"

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system"

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === "system" || saved === "light" || saved === "dark") {
      return saved
    }
  } catch {
    // Ignore localStorage access errors
  }

  return "system"
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  // Listen to OS system color scheme changes in real-time
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme
  const isDark = resolvedTheme === "dark"

  const applyTheme = useCallback((currentTheme: ResolvedTheme) => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    if (currentTheme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme, applyTheme])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore localStorage write errors
    }
  }, [theme])

  // 3-way toggle: system -> light -> dark -> system
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "system") return "light"
      if (prev === "light") return "dark"
      return "system"
    })
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  return {
    theme,
    resolvedTheme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
