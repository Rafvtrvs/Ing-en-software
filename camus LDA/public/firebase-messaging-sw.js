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

function titleBody(payload) {
  const title =
    (payload.notification && payload.notification.title) ||
    (payload.data && payload.data.title) ||
    'Camus LDA'
  const body =
    (payload.notification && payload.notification.body) ||
    (payload.data && payload.data.body) ||
    ''
  return { title: String(title), body: String(body) }
}

function queueInbox(title, body) {
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
      tx.objectStore('inbox').add({ title, body, at: Date.now() })
    }
  } catch (_) {
    /* ignore */
  }
}

function notifyOpenClients(title, body) {
  const msg = { type: 'CAMUS_FCM', title, body }
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
    const { title, body } = titleBody(payload)
    // Si FCM ya trae `notification`, el navegador la muestra solo.
    // Solo dibujamos nosotros cuando el payload es data-only.
    if (!payload.notification) {
      self.registration.showNotification(title, {
        body,
        icon: '/vite.svg',
        tag: `camus-${title}`.slice(0, 64),
        renotify: false,
        data: payload.data || {},
      })
    }
    queueInbox(title, body)
    notifyOpenClients(title, body)
  })
}
