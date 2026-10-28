import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_AREA,
  SETTINGS_STORAGE_KEY,
  loadSettings,
  normalizeSettings,
  saveSettings,
  type Settings,
} from "."
import { SettingsContext } from "./SettingsContext"

interface Props {
  children: ReactNode
}

export function SettingsProvider({ children }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS)

  const applySettings = useCallback((nextSettings: Settings) => {
    settingsRef.current = nextSettings
    setSettings(nextSettings)
  }, [])

  useEffect(() => {
    let active = true

    void loadSettings().then(storedSettings => {
      if (!active) return

      applySettings(storedSettings)
      setLoaded(true)
    })

    return () => {
      active = false
    }
  }, [applySettings])

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== SETTINGS_STORAGE_AREA) return

      const change = changes[SETTINGS_STORAGE_KEY]

      if (!change) return

      applySettings(normalizeSettings(change.newValue))
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [applySettings])

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const nextSettings = normalizeSettings({
        ...settingsRef.current,
        ...patch,
      })

      applySettings(nextSettings)
      void saveSettings(nextSettings)
    },
    [applySettings]
  )

  const value = useMemo(
    () => ({ settings, loaded, updateSettings }),
    [settings, loaded, updateSettings]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
