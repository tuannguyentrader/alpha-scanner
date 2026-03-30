const CACHE_NAME = 'alpha-scanner-v2'
const STATIC_ASSETS = ['/', '/offline.html']

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API routes: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || new Response('{"error":"offline"}', {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }))
        )
    )
    return
  }

  // Static assets: cache-first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // For navigation, show offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
          return new Response('', { status: 503 })
        })
    })
  )
})

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Alpha Scanner', body: event.data.text() }
  }

  const { title, body, tag, url, icon, badge } = payload

  const options = {
    body: body || '',
    tag: tag || 'default',
    icon: icon || '/icon-192.png',
    badge: badge || '/icon-192.png',
    data: { url: url || '/' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(title || 'Alpha Scanner', options)
      .then(() => {
        // Update badge count
        if (navigator.setAppBadge) {
          return navigator.setAppBadge()
        }
      })
  )
})

// Notification click handler — open app to relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    // Clear badge on dismiss
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge()
    }
    return
  }

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If an existing window is open, focus it and navigate
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl)
    }).then(() => {
      // Clear badge after interaction
      if (navigator.clearAppBadge) {
        navigator.clearAppBadge()
      }
    })
  )
})
