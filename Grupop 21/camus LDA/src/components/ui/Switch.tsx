import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  label?: string
  description?: string
}

export function Switch({
  checked,
  onChange,
  disabled,
  id,
  label,
  description,
}: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-slate-900">
              {label}
            </label>
          )}
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
