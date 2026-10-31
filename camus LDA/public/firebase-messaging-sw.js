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

const cfg = configFromQuery()
if (cfg.apiKey && cfg.projectId && cfg.appId) {
  firebase.initializeApp(cfg)
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || 'Camus LDA'
    const body = (payload.notification && payload.notification.body) || ''
    self.registration.showNotification(title, {
      body,
      icon: '/vite.svg',
      data: payload.data || {},
    })
  })
}
