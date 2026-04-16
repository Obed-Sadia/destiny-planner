/// <reference lib="webworker" />
// DestinyPlanner — Service Worker personnalisé (vite-plugin-pwa injectManifest)
// Gère : précache Workbox + push notifications

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision: string | null }[]
}

// Précache injecté automatiquement par vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Push notifications ──────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let title = 'DestinyPlanner'
  let body = ''

  try {
    const payload = event.data.json() as { title?: string; body?: string }
    title = payload.title ?? title
    body = payload.body ?? body
  } catch {
    body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.startsWith(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow('/')
    })
  )
})
