import type { AppRole, SystemUser } from '@/types'
import { getRoleName } from '@/data/mock/users'

export function exportUsersToCsv(users: SystemUser[], roles: AppRole[]) {
  const headers = ['Nombre', 'Email', 'Teléfono', 'Rol', 'Estado', 'Último acceso']
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.phone,
    getRoleName(roles, u.roleId),
    u.status,
    u.lastLogin === '—' ? '' : u.lastLogin,
  ])
  downloadCsv(`usuarios-camus_${dateSuffix()}.csv`, headers, rows)
}

export function exportRolesToCsv(roles: AppRole[]) {
  const headers = ['Rol', 'Descripción', 'Estado', 'Permisos']
  const rows = roles.map((r) => [
    r.name,
    r.description,
    r.status,
    r.permissions.join('; '),
  ])
  downloadCsv(`roles-camus_${dateSuffix()}.csv`, headers, rows)
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function dateSuffix() {
  return new Date().toISOString().slice(0, 10)
}
