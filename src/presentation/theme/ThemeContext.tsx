import { createContext, useContext } from "react"

export type ThemeMode = "light" | "dark"

export interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}
