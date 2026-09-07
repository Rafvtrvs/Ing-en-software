import type { Client, ClientStatus, KpiData } from '@/types'
import { Building2, UserCheck, UserPlus, Users } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Activos: '#22c55e',
  Inactivos: '#ef4444',
  Pendientes: '#f59e0b',
  Bloqueados: '#94a3b8',
}

const STATUS_MAP: Record<ClientStatus, string> = {
  Activo: 'Activos',
  Inactivo: 'Inactivos',
  Pendiente: 'Pendientes',
  Bloqueado: 'Bloqueados',
}

export function getClientsByStatus(clients: Client[]) {
  const counts: Record<string, number> = {
    Activos: 0,
    Inactivos: 0,
    Pendientes: 0,
    Bloqueados: 0,
  }

  clients.forEach((c) => {
    const key = STATUS_MAP[c.status]
    counts[key]++
  })

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name],
  }))
}

export function getClientsKpis(clients: Client[]): KpiData[] {
  const total = clients.length
  const active = clients.filter((c) => c.status === 'Activo').length
  const companies = new Set(clients.map((c) => c.company)).size

  const now = new Date()
  const newThisMonth = clients.filter((c) => {
    if (!c.createdAt) return false
    const d = new Date(c.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return [
    {
      title: 'Clientes Totales',
      value: String(total),
      trend: `${total} registrados`,
      trendDirection: 'up',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Clientes Activos',
      value: String(active),
      trend: total ? `${Math.round((active / total) * 100)}% del total` : '0%',
      trendDirection: 'up',
      icon: UserCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Nuevos este Mes',
      value: String(newThisMonth),
      trend: 'Registrados en el mes',
      trendDirection: 'up',
      icon: UserPlus,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Empresas',
      value: String(companies),
      trend: 'Empresas únicas',
      trendDirection: 'up',
      icon: Building2,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]
}
