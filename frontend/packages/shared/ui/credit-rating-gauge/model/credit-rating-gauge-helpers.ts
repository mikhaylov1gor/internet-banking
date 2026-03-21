export const GAUGE_CX = 110
export const GAUGE_CY = 110
export const GAUGE_R = 86

export const scoreToRad = (score: number) =>
  Math.PI * (1 - Math.max(0, Math.min(100, score)) / 100)

export const polar = (score: number) => {
  const a = scoreToRad(score)
  return {
    x: GAUGE_CX + GAUGE_R * Math.cos(a),
    y: GAUGE_CY - GAUGE_R * Math.sin(a),
  }
}

export const arcPath = (fromScore: number, toScore: number) => {
  const p0 = polar(fromScore)
  const p1 = polar(toScore)
  return `M ${p0.x} ${p0.y} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${p1.x} ${p1.y}`
}

export const ruPaymentWord = (n: number) => {
  const m = n % 10
  const h = n % 100
  if (m === 1 && h !== 11) return 'платёж'
  if (m >= 2 && m <= 4 && (h < 12 || h > 14)) return 'платежа'
  return 'платежей'
}

export const riskLevelHint = (riskLevel: string, ctx: 'client' | 'employee'): string | null => {
  if (riskLevel === 'высокий') {
    return ctx === 'employee'
      ? 'Совет: обсудите с клиентом погашение просрочек и соблюдение графика — это главный способ улучшить рейтинг.'
      : 'Совет: закрывайте просрочки в первую очередь и не пропускайте очередные платежи — баллы начнут восстанавливаться.'
  }
  if (riskLevel === 'средний') {
    return ctx === 'employee'
      ? 'Умеренная дисциплина: мягкое напоминание о сроках платежей часто помогает снизить риск.'
      : 'Есть запас по росту: стабильные платежи в срок заметно подтянут показатель.'
  }
  if (riskLevel === 'низкий') {
    return ctx === 'employee'
      ? 'Надёжный заёмщик: стабильная дисциплина по кредитам.'
      : 'Вы надёжный заёмщик — продолжайте в том же духе.'
  }
  return null
}
