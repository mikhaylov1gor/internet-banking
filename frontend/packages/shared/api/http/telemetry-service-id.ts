export type ClientTelemetryServiceLabel = 'web-client' | 'employee-web'

let current: ClientTelemetryServiceLabel = 'web-client'

export const setClientTelemetryServiceLabel = (label: ClientTelemetryServiceLabel): void => {
  current = label
}

export const getClientTelemetryServiceLabel = (): ClientTelemetryServiceLabel => current
