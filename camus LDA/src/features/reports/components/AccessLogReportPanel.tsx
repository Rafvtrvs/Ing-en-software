import { useMemo, useState } from 'react'
import { useAccessLogStore } from '@/store/useAccessLogStore'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

/** RF-34 — bitácora de accesos (login / logout) almacenada en el dispositivo */
export function AccessLogReportPanel() {
  const entries = useAccessLogStore((s) => s.entries)
  const [action, setAction] = useState<'all' | 'login' | 'logout'>('all')

  const filtered = useMemo(
    () =>
      entries.filter((entry) => (action === 'all' ? true : entry.action === action)),
    [entries, action],
  )

  const exportCsv = () => {
    const header = 'Fecha;Usuario;Correo;Rol;Acción'
    const rows = filtered.map((entry) =>
      [
        new Date(entry.at).toLocaleString('es-CL'),
        entry.userName,
        entry.userEmail,
        entry.role,
        entry.action === 'login' ? 'Inicio de sesión' : 'Cierre de sesión',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(';'),
    )
    const blob = new Blob([[header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bitacora-accesos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Bitácora de accesos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registro local de inicios y cierres de sesión (RF-34).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={action}
            onChange={(e) => setAction(e.target.value as typeof action)}
            aria-label="Filtrar por acción"
          >
            <option value="all">Todas las acciones</option>
            <option value="login">Solo inicios</option>
            <option value="logout">Solo cierres</option>
          </Select>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aún no hay accesos registrados. Inicia o cierra sesión para generar entradas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Usuario</th>
                <th className="px-2 py-2">Correo</th>
                <th className="px-2 py-2">Rol</th>
                <th className="px-2 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 tabular-nums text-slate-700">
                    {new Date(entry.at).toLocaleString('es-CL')}
                  </td>
                  <td className="px-2 py-2 font-medium text-slate-900">{entry.userName}</td>
                  <td className="px-2 py-2 text-slate-600">{entry.userEmail}</td>
                  <td className="px-2 py-2 text-slate-600">{entry.role}</td>
                  <td className="px-2 py-2 text-slate-800">
                    {entry.action === 'login' ? 'Inicio de sesión' : 'Cierre de sesión'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
