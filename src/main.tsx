import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import { App } from '@/App'
import { initBackupService } from '@/services/backup'
import { initNotifications } from '@/services/notifications'

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Services de résilience et notifications — non bloquants
initBackupService()
initNotifications()
