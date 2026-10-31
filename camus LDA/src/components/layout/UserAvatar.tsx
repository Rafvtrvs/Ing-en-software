import { User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'

interface UserAvatarProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Si se omite, usa el avatar del perfil en sesión */
  src?: string | null
  alt?: string
}

const SIZES = {
  sm: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-9 w-9', icon: 'h-5 w-5' },
  lg: { box: 'h-16 w-16', icon: 'h-8 w-8' },
} as const

/** Avatar de usuario: foto de perfil si existe, si no silueta. */
export function UserAvatar({
  className,
  size = 'md',
  src,
  alt = 'Foto de perfil',
}: UserAvatarProps) {
  const storeAvatar = useAppStore((s) => s.user.avatar)
  const imageSrc = (src !== undefined ? src : storeAvatar)?.trim() || ''
  const spec = SIZES[size]

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          'shrink-0 rounded-full object-cover ring-1 ring-slate-200',
          'dark:ring-slate-600',
          spec.box,
          className,
        )}
      />
    )
  }

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
