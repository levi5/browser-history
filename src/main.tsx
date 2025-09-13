import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

import './presentation/global/css/global.css'
import './presentation/global/css/reset.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
