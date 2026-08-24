import { Check, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const features = [
  'Ver órdenes asignadas',
  'Actualizar estados en terreno',
  'Registrar materiales usados',
  'Capturar evidencias fotográficas',
]

export function MobileAppCard() {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 text-white">
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">App Móvil - Técnicos</h3>
            <p className="text-sm text-blue-100">Gestión en terreno</p>
          </div>
        </div>
        <ul className="mb-6 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-blue-50">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
        >
          Más información
        </Button>
      </div>
    </Card>
  )
}
