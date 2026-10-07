import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AppProviders from './app/providers'
import AppToaster from './shared/notifications/AppToaster'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
        <AppToaster />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
