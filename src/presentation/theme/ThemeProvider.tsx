import { type ReactNode, useState, useEffect } from "react"
import  { type ThemeMode, ThemeContext } from "./ThemeContext"

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>("light")

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setMode(mq.matches ? "dark" : "light")


    const listener = (e: MediaQueryListEvent) =>
      setMode(e.matches ? "dark" : "light")
    mq.addEventListener("change", listener)

    return () => mq.removeEventListener("change", listener)
  }, [])


  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
