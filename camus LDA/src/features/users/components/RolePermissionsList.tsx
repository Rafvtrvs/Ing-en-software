import { Check } from 'lucide-react'
import { ALL_PERMISSIONS } from '@/data/mock/users'
import type { PermissionKey } from '@/types'
import { cn } from '@/utils/cn'

interface RolePermissionsListProps {
  permissions: PermissionKey[]
  compact?: boolean
}

export function RolePermissionsList({ permissions, compact }: RolePermissionsListProps) {
  const modules = [...new Set(ALL_PERMISSIONS.map((p) => p.module))]

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {modules.map((module) => {
        const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === module)
        const active = modulePerms.filter((p) => permissions.includes(p.key))
        if (active.length === 0) return null

        return (
          <div key={module}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {module}
            </p>
            <ul className="space-y-1">
              {active.map((perm) => (
                <li
                  key={perm.key}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {perm.label}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
