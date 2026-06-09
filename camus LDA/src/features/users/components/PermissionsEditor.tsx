import { ALL_PERMISSIONS } from '@/data/mock/users'
import type { PermissionKey } from '@/types'
import { cn } from '@/utils/cn'

interface PermissionsEditorProps {
  value: PermissionKey[]
  onChange: (permissions: PermissionKey[]) => void
  disabled?: boolean
}

export function PermissionsEditor({ value, onChange, disabled }: PermissionsEditorProps) {
  const modules = [...new Set(ALL_PERMISSIONS.map((p) => p.module))]

  const toggle = (key: PermissionKey) => {
    if (disabled) return
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key))
    } else {
      onChange([...value, key])
    }
  }

  const toggleModule = (module: string, select: boolean) => {
    if (disabled) return
    const keys = ALL_PERMISSIONS.filter((p) => p.module === module).map((p) => p.key)
    if (select) {
      const merged = new Set([...value, ...keys])
      onChange([...merged])
    } else {
      onChange(value.filter((k) => !keys.includes(k)))
    }
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === module)
        const allSelected = modulePerms.every((p) => value.includes(p.key))

        return (
          <div key={module} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{module}</p>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleModule(module, !allSelected)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {modulePerms.map((perm) => {
                const checked = value.includes(perm.key)
                return (
                  <label
                    key={perm.key}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      checked
                        ? 'border-primary/30 bg-primary/5 text-slate-900'
                        : 'border-slate-100 bg-white text-slate-600',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(perm.key)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                    />
                    {perm.label}
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
