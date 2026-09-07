import { Card } from '@/components/ui/Card'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
      <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Este módulo se desarrollará en la siguiente fase del proyecto.
      </p>
    </Card>
  )
}
