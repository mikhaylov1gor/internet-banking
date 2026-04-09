export const formatPhone = (value: string): string => {
  let cleaned = value.replace(/[^\d+]/g, '')

  if (cleaned.startsWith('+8')) {
    cleaned = '+7' + cleaned.slice(2)
  }

  if (cleaned.startsWith('8')) {
    cleaned = '+7' + cleaned.slice(1)
  }

  if (!cleaned.startsWith('+7') && cleaned.length > 0) {
    const digits = cleaned.replace(/\+/g, '')
    if (digits.length > 0) {
      cleaned = `+7${digits.slice(0, 10)}`
    }
  }

  if (cleaned.startsWith('+7')) {
    const digits = cleaned.slice(2).replace(/\D/g, '')
    if (digits.length === 0) return '+7'
    if (digits.length <= 3) return `+7 (${digits}`
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`
    if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    if (digits.length <= 10)
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
  }

  return cleaned
}
