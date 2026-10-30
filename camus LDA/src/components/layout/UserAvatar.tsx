import { User } from 'lucide-react'
import { cn } from '@/utils/cn'

interface UserAvatarProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-9 w-9', icon: 'h-5 w-5' },
  lg: { box: 'h-16 w-16', icon: 'h-8 w-8' },
} as const

/** Silueta genérica. No usa foto ni avatar generado. */
export function UserAvatar({ className, size = 'md' }: UserAvatarProps) {
  const spec = SIZES[size]
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500',
        'dark:bg-slate-700 dark:text-slate-200',
        spec.box,
        className,
      )}
      aria-hidden
    >
      <User className={spec.icon} strokeWidth={1.75} />
    </span>
  )
}
