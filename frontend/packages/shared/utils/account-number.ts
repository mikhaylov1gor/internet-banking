export const ACCOUNT_NUMBER_DIGIT_COUNT = 16

export function digitsOnlyAccountNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_DIGIT_COUNT)
}

export function formatAccountNumberMasked(digits: string): string {
  const d = digitsOnlyAccountNumber(digits)
  const parts: string[] = []
  for (let i = 0; i < d.length; i += 4) {
    parts.push(d.slice(i, i + 4))
  }
  return parts.join('-')
}

export function isCompleteAccountNumberDigits(digits: string): boolean {
  return digitsOnlyAccountNumber(digits).length === ACCOUNT_NUMBER_DIGIT_COUNT
}

export function formatAccountNumberShort(digits: string): string {
  const d = digitsOnlyAccountNumber(digits)
  if (d.length < 4) {
    return d.length > 0 ? formatAccountNumberMasked(d) : '····'
  }
  return `****-****-****-${d.slice(-4)}`
}
