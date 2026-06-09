export function formatLastLogin(lastLogin: string): string {
  if (lastLogin === '—') return 'Nunca'
  try {
    const date = new Date(lastLogin)
    if (Number.isNaN(date.getTime())) return lastLogin
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return lastLogin
  }
}
