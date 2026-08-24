import type { ReactNode } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'

interface SettingsCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function SettingsCard({ title, subtitle, children, footer }: SettingsCardProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-6 border-t border-slate-100 pt-4">{footer}</div>}
    </Card>
  )
}
