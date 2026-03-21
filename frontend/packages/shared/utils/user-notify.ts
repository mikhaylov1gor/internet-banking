export const USER_NOTIFY_EVENT = 'shared:notify-user'

export type UserNotifyDetail = { message: string }

export function notifyUser(message: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<UserNotifyDetail>(USER_NOTIFY_EVENT, {
      detail: { message },
    })
  )
}
