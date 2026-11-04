/* eslint-disable no-undef */
/* Firebase Cloud Messaging — service worker (compat)
 * Muestra UNA notificación (payload data-only) y avisa a las pestañas
 * abiertas para llenar la campanita in-app.
 */
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
    (payload.data && payload.data.title) ||
    (payload.notification && payload.notification.title) ||
    'Camus LDA'
  const body =
    (payload.data && payload.data.body) ||
    (payload.notification && payload.notification.body) ||
    ''
  return { title, body }
}

const cfg = configFromQuery()
if (cfg.apiKey && cfg.projectId && cfg.appId) {
  firebase.initializeApp(cfg)
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const { title, body } = titleBody(payload)
    self.registration.showNotification(title, {
      body,
      icon: '/vite.svg',
      tag: `camus-${title}-${body}`.slice(0, 100),
      renotify: false,
      data: payload.data || {},
    })
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'CAMUS_FCM',
          title,
          body,
        })
      })
    })
  })
}
