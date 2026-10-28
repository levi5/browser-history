import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useSettings } from "../settings/SettingsContext"
import { type ThemeMode, ThemeContext } from "./ThemeContext"

interface ThemeProviderProps {
  children: ReactNode
}

function getSystemMode(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings } = useSettings()
  const [systemMode, setSystemMode] = useState<ThemeMode>(getSystemMode)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const mode: ThemeMode =
    settings.theme === "system" ? systemMode : settings.theme

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  const value = useMemo(() => ({ mode }), [mode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
