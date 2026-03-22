export const USER_NOTIFY_EVENT = 'shared:notify-user'

export type UserNotifyVariant = 'default' | 'warning'

export type UserNotifyDetail = { message: string; variant?: UserNotifyVariant }

export function notifyUser(message: string, variant: UserNotifyVariant = 'default'): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<UserNotifyDetail>(USER_NOTIFY_EVENT, {
      detail: { message, variant },
    })
  )
}
