export type ThemeSetting = "system" | "light" | "dark"

export interface Settings {
  theme: ThemeSetting
  pageSize: number
  confirmDelete: boolean
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  pageSize: 20,
  confirmDelete: true,
}

export const SETTINGS_STORAGE_KEY = "settings"
export const SETTINGS_STORAGE_AREA = "sync"

function isThemeSetting(value: unknown): value is ThemeSetting {
  return value === "system" || value === "light" || value === "dark"
}

function isPageSize(value: unknown): value is number {
  return PAGE_SIZE_OPTIONS.some(option => option === value)
}

export function normalizeSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS

  const stored = value as Partial<Settings>

  return {
    theme: isThemeSetting(stored.theme) ? stored.theme : DEFAULT_SETTINGS.theme,
    pageSize: isPageSize(stored.pageSize)
      ? stored.pageSize
      : DEFAULT_SETTINGS.pageSize,
    confirmDelete:
      typeof stored.confirmDelete === "boolean"
        ? stored.confirmDelete
        : DEFAULT_SETTINGS.confirmDelete,
  }
}

export function loadSettings(): Promise<Settings> {
  return new Promise(resolve => {
    chrome.storage.sync.get(SETTINGS_STORAGE_KEY, result => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
        resolve(DEFAULT_SETTINGS)
        return
      }

      resolve(normalizeSettings(result[SETTINGS_STORAGE_KEY]))
    })
  })
}

export function saveSettings(settings: Settings): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
      }

      resolve()
    })
  })
}
