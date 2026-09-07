import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { AuditLogEntry } from '@/data/mock/audit'
import { formatDate, formatTime } from '@/utils/formatters'

interface AuditLogDetailPanelProps {
  log: AuditLogEntry
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function safeFormatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value || '—'
  return formatDate(d)
}

function safeFormatTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return formatTime(d)
}

function formatAuditValue(value: string | null): string {
  if (!value) return '—'
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.nombre === 'string') return parsed.nombre
      if (typeof parsed.estado === 'string') return parsed.estado
      if (typeof parsed.id === 'string') return parsed.id
      if (typeof parsed.idOt === 'string') return parsed.idOt
      if (typeof parsed.id_ot === 'string') return String(parsed.id_ot)
      const preview = Object.entries(parsed)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(' · ')
      return preview || value
    }
  } catch {
    // valor en texto plano
  }
  return value
}

export function AuditLogDetailPanel({ log }: AuditLogDetailPanelProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        {log.accion} en <span className="font-medium text-slate-800">{log.moduloAfectado}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-1">
        <DetailItem icon={Calendar} label="Fecha" value={safeFormatDate(log.fechaHora)} />
        <DetailItem icon={Clock} label="Hora" value={safeFormatTime(log.fechaHora)} />
        <DetailItem icon={MapPin} label="Dónde se realizó" value={log.ubicacion || 'No registrado'} />
        <DetailItem icon={User} label="Realizado por" value={log.usuario} />
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Resumen del cambio
        </p>
        <div className="grid gap-4">
          <div>
            <p className="text-xs text-slate-500">Módulo</p>
            <Badge label={log.moduloAfectado} className="mt-1" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Acción</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{log.accion}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Valor anterior</p>
            <p className="mt-1 break-words text-sm text-slate-600">
              {formatAuditValue(log.valorAnterior)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Valor nuevo</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
              {formatAuditValue(log.valorNuevo)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
