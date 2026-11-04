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

function notifyOpenClients(item) {
  const msg = { type: 'CAMUS_FCM', ...item }
  try {
    const bc = new BroadcastChannel('camus-fcm')
    bc.postMessage(msg)
    bc.close()
  } catch (_) {
    /* ignore */
  }
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(msg))
  })
}

const cfg = configFromQuery()
if (cfg.apiKey && cfg.projectId && cfg.appId) {
  firebase.initializeApp(cfg)
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const item = pickPayload(payload)
    if (!payload.notification) {
      self.registration.showNotification(item.title, {
        body: item.body,
        icon: '/vite.svg',
        tag: `camus-${item.title}`.slice(0, 64),
        renotify: false,
        data: { link: item.link, orderId: item.orderId },
      })
    }
    queueInbox(item)
    notifyOpenClients(item)
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
