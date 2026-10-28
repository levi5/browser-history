import { useEffect } from "react"

import { t } from "../i18n"
import {
  PAGE_SIZE_OPTIONS,
  type ThemeSetting,
} from "../settings"
import { useSettings } from "../settings/SettingsContext"
import styles from "./options.module.css"

const THEME_OPTIONS: ThemeSetting[] = ["system", "light", "dark"]

function themeLabel(theme: ThemeSetting): string {
  switch (theme) {
    case "light":
      return t("theme_light")
    case "dark":
      return t("theme_dark")
    default:
      return t("theme_system")
  }
}

export function OptionsPage() {
  const { settings, loaded, updateSettings } = useSettings()
  const title = t("options_title")

  useEffect(() => {
    document.title = title
  }, [title])

  if (!loaded) {
    return <p className={styles.loading}>{t("loading_settings")}</p>
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("settings_theme")}</h2>
        <div className={styles.choices}>
          {THEME_OPTIONS.map(theme => (
            <label key={theme} className={styles.choice}>
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.theme === theme}
                onChange={() => updateSettings({ theme })}
              />
              {themeLabel(theme)}
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <label className={styles.sectionTitle} htmlFor="page-size">
          {t("page_size")}
        </label>
        <select
          id="page-size"
          className={styles.select}
          value={settings.pageSize}
          onChange={event =>
            updateSettings({ pageSize: Number(event.target.value) })
          }
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>
              {t("page_size_option", String(size))}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.section}>
        <label className={styles.choice}>
          <input
            type="checkbox"
            checked={settings.confirmDelete}
            onChange={event =>
              updateSettings({ confirmDelete: event.target.checked })
            }
          />
          {t("confirm_delete_setting")}
        </label>
        <p className={styles.hint}>{t("confirm_delete_hint")}</p>
      </section>

      <p className={styles.saved}>{t("options_saved")}</p>

      <button
        type="button"
        className={styles.button}
        onClick={() => {
          void chrome.tabs.create({
            url: chrome.runtime.getURL("index.html"),
          })
        }}
      >
        {t("open_history")}
      </button>
    </main>
  )
}
