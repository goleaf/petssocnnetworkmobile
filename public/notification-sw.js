self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification?.data?.url || "/notifications"

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      const appUrl = new URL(url, self.location.origin).href

      for (const client of allClients) {
        if (client.url === appUrl && "focus" in client) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(appUrl)
      }
    })(),
  )
})
