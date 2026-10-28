import { createContext, useContext } from "react"

import { DEFAULT_SETTINGS, type Settings } from "."

export interface SettingsContextValue {
  settings: Settings
  loaded: boolean
  updateSettings: (patch: Partial<Settings>) => void
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  updateSettings: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}
