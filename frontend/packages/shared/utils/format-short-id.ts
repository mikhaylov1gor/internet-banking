const DEFAULT_VISIBLE = 8

export function formatShortId(id: string | undefined | null, visibleLength = DEFAULT_VISIBLE): string {
  if (id == null || id === '') return '—'
  const t = id.trim()
  if (t.length <= visibleLength) return t
  return `${t.slice(0, visibleLength)}…`
}
