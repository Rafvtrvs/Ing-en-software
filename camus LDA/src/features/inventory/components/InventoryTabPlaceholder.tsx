import { Card } from '@/components/ui/Card'

interface InventoryTabPlaceholderProps {
  title: string
  description: string
}

export function InventoryTabPlaceholder({
  title,
  description,
}: InventoryTabPlaceholderProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-500">{description}</p>
      <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Esta sección se desarrollará en una próxima fase del proyecto.
      </p>
    </Card>
  )
}
