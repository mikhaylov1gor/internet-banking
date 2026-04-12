import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging'
import { registerPushDevice } from '@shared/api/endpoints/users'
import { notifyUser } from '@shared/utils'
import { FIREBASE_VAPID_KEY, FIREBASE_WEB_CONFIG } from './firebase-web-config'

let firebaseApp: FirebaseApp | null = null
let messaging: Messaging | null = null
let foregroundUnsubscribe: (() => void) | null = null

const ensureMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null
  const supported = await isSupported()
  if (!supported) return null
  if (!firebaseApp) {
    firebaseApp = initializeApp({ ...FIREBASE_WEB_CONFIG })
  }
  if (!messaging) {
    messaging = getMessaging(firebaseApp)
  }
  return messaging
}

const attachForegroundListener = (m: Messaging): void => {
  if (foregroundUnsubscribe) return
  foregroundUnsubscribe = onMessage(m, (payload) => {
    const title = payload.notification?.title?.trim() || 'Операция'
    const body = payload.notification?.body?.trim() || ''
    const text = body ? `${title}: ${body}` : title
    notifyUser(text, 'default')
  })
}

export const registerWebPushToken = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem('push_registered') === '1') return
  const m = await ensureMessaging()
  if (!m) return
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const token = await getToken(m, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })
  if (!token) return
  await registerPushDevice({ token, platform: 'web' })
  sessionStorage.setItem('push_registered', '1')
  attachForegroundListener(m)
}
