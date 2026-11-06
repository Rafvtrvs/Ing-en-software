/* eslint-disable no-undef */
/* Firebase Cloud Messaging — service worker (compat) */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

function configFromQuery() {
  try {
    const q = new URL(self.location.href).searchParams
    return {
      apiKey: q.get('apiKey') || '',
      authDomain: q.get('authDomain') || '',
      projectId: q.get('projectId') || '',
      messagingSenderId: q.get('messagingSenderId') || '',
      appId: q.get('appId') || '',
    }
  } catch {
    return {}
  }
}

function pickPayload(payload) {
  const title =
    (payload.notification && payload.notification.title) ||
    (payload.data && payload.data.title) ||
    'Camus LDA'
  const body =
    (payload.notification && payload.notification.body) ||
    (payload.data && payload.data.body) ||
    ''
  const link = (payload.data && payload.data.link) || '/'
  const orderId = (payload.data && payload.data.orderId) || ''
  const notifType = (payload.data && payload.data.notifType) || 'system'
  return {
    title: String(title),
    body: String(body),
    link: String(link),
    orderId: String(orderId),
    notifType: String(notifType),
  }
}

function queueInbox(item) {
  try {
    const req = indexedDB.open('camus-fcm', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('inbox')) {
        db.createObjectStore('inbox', { autoIncrement: true })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('inbox', 'readwrite')
      tx.objectStore('inbox').add({ ...item, at: Date.now() })
    }
  } catch (_) {
    /* ignore */
  }
}

/** Una sola vía: postMessage a ventanas abiertas; si no hay, cola IndexedDB. */
function deliverToApp(item) {
  const msg = { type: 'CAMUS_FCM', ...item }
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    if (clients.length > 0) {
      clients.forEach((client) => client.postMessage(msg))
      return
    }
    queueInbox(item)
  })
}

const cfg = configFromQuery()
if (cfg.apiKey && cfg.projectId && cfg.appId) {
  firebase.initializeApp(cfg)
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const item = pickPayload(payload)
    const generic = item.title.replace(/\s+/g, '').toLowerCase() === 'camuslda'
    if (!item.body && generic) return
    if (!payload.notification) {
      self.registration.showNotification(item.title, {
        body: item.body,
        icon: '/vite.svg',
        tag: `camus-${item.orderId || item.title}`.slice(0, 64),
        renotify: false,
        data: { link: item.link, orderId: item.orderId },
      })
    }
    return deliverToApp(item)
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link =
    (event.notification.data && event.notification.data.link) || '/'
  const url = new URL(link, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'CAMUS_FCM_NAV', link })
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
