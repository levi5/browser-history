import { Page } from './presentation/pages/page'
import { ThemeProvider } from './presentation/theme/ThemeProvider'

export const App = () => {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  )
}
