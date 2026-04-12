import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging'
import { registerPushDevice } from '@shared/api/endpoints/users'
import { notifyUser } from '@shared/utils'
import { FIREBASE_VAPID_KEY, FIREBASE_WEB_CONFIG } from './firebase-web-config'

let firebaseApp: FirebaseApp | null = null
let messaging: Messaging | null = null
let foregroundUnsubscribe: (() => void) | null = null

let registerWebPushInFlight: Promise<void> | null = null

const ensureMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') {
    return null
  }
  const supported = await isSupported()
  if (!supported) {
    return null
  }
  if (!firebaseApp) {
    firebaseApp = initializeApp({ ...FIREBASE_WEB_CONFIG })
  }
  if (!messaging) {
    messaging = getMessaging(firebaseApp)
  }
  return messaging
}

/** FCM вызывает PushManager.subscribe только когда у регистрации уже есть активный worker. */
const waitForServiceWorkerActive = async (
  registration: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration> => {
  if (registration.active) {
    return registration
  }
  const pending = registration.installing ?? registration.waiting
  if (pending) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Service Worker: превышено время ожидания активации'))
      }, 60_000)
      const onStateChange = (): void => {
        if (registration.active) {
          window.clearTimeout(timeout)
          pending.removeEventListener('statechange', onStateChange)
          resolve()
        } else if (pending.state === 'redundant') {
          window.clearTimeout(timeout)
          pending.removeEventListener('statechange', onStateChange)
          reject(new Error('Service Worker: установка прервана'))
        }
      }
      pending.addEventListener('statechange', onStateChange)
      if (pending.state === 'activated' && registration.active) {
        window.clearTimeout(timeout)
        pending.removeEventListener('statechange', onStateChange)
        resolve()
      }
    })
    return registration
  }
  await navigator.serviceWorker.ready
  return registration
}

const dataStr = (data: Record<string, unknown> | undefined, key: string): string => {
  const v = data?.[key]
  return typeof v === 'string' ? v : ''
}

const extractForegroundText = (payload: {
  notification?: { title?: string; body?: string }
  data?: Record<string, unknown>
}): { title: string; body: string; line: string } => {
  const d = payload.data ?? {}
  const titleCandidate =
    payload.notification?.title ||
    dataStr(d, 'title') ||
    dataStr(d, 'notification_title') ||
    'Уведомление'
  const title = titleCandidate.trim()
  const body = (
    payload.notification?.body ||
    dataStr(d, 'body') ||
    dataStr(d, 'notification_body') ||
    ''
  ).trim()
  const line = body ? `${title}: ${body}` : title
  return { title, body, line }
}

const showForegroundPush = (title: string, body: string, line: string): void => {
  notifyUser(line, 'default')
  if (typeof Notification === 'undefined') {
    return
  }
  if (Notification.permission !== 'granted') {
    return
  }
  try {
    new Notification(title, { body: body || undefined, silent: false })
  } catch {
    /* остаётся toast */
  }
}

const attachForegroundListener = (m: Messaging): void => {
  foregroundUnsubscribe?.()
  foregroundUnsubscribe = null
  foregroundUnsubscribe = onMessage(m, (payload) => {
    const { title, body, line } = extractForegroundText(payload)
    showForegroundPush(title, body, line)
  })
}

export const registerWebPushToken = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return
  }
  if (registerWebPushInFlight) {
    await registerWebPushInFlight
    return
  }
  registerWebPushInFlight = runRegisterWebPushToken()
  try {
    await registerWebPushInFlight
  } finally {
    registerWebPushInFlight = null
  }
}

async function runRegisterWebPushToken(): Promise<void> {
  const m = await ensureMessaging()
  if (!m) {
    return
  }

  if (sessionStorage.getItem('push_registered') === '1') {
    attachForegroundListener(m)
    return
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
  })
  const readyRegistration = await waitForServiceWorkerActive(registration)

  const token = await getToken(m, {
    vapidKey: FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: readyRegistration,
  })
  if (!token) {
    return
  }

  await registerPushDevice({ token, platform: 'web' })

  sessionStorage.setItem('push_registered', '1')
  attachForegroundListener(m)
}
