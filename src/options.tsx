import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { OptionsPage } from "./presentation/pages/options"
import { SettingsProvider } from "./presentation/settings/SettingsProvider"
import { ThemeProvider } from "./presentation/theme/ThemeProvider"

import "./presentation/global/css/global.css"
import "./presentation/global/css/reset.css"

document.documentElement.lang = chrome.i18n.getUILanguage()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <OptionsPage />
      </ThemeProvider>
    </SettingsProvider>
  </StrictMode>
)
