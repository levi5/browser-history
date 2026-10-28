import { createContext, useContext } from "react"

export type ThemeMode = "light" | "dark"

export interface ThemeContextValue {
  mode: ThemeMode
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
})

export function useTheme() {
  return useContext(ThemeContext)
}
