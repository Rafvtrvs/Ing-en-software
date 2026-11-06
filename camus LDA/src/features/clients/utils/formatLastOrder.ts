/** Sin OT asociada: vacío, guion o el guion mal codificado (â€”). */
export function formatLastOrder(value?: string | null): string {
  const text = (value ?? '').replace(/\u00a0/g, ' ').trim()
  if (!text || text === '—' || text === '–' || text === '-' || text.startsWith('â€')) {
    return 'n/a'
  }
  return text
}
