import { Page } from './presentation/pages/page'
import { SettingsProvider } from './presentation/settings/SettingsProvider'
import { ThemeProvider } from './presentation/theme/ThemeProvider'

export const App = () => {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    </SettingsProvider>
  )
}
