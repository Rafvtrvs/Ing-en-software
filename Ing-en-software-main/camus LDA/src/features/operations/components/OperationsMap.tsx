import { MapPin } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

const legend = [
  { label: 'En Curso', color: 'bg-emerald-500' },
  { label: 'En Ruta', color: 'bg-blue-500' },
  { label: 'En Espera', color: 'bg-amber-500' },
  { label: 'Completada', color: 'bg-slate-400' },
  { label: 'Retrasada', color: 'bg-red-500' },
]

export function OperationsMap() {
  return (
    <Card className="h-full">
      <CardHeader title="Mapa de Operaciones en Tiempo Real" />
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <div className="flex h-64 items-center justify-center sm:h-72">
          <div className="text-center">
            <MapPin className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">Mapa interactivo</p>
            <p className="text-xs text-slate-400">Integración con mapas en fase siguiente</p>
          </div>
          {/* Marcadores decorativos */}
          <span className="absolute left-[20%] top-[30%] h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30" />
          <span className="absolute left-[55%] top-[45%] h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-500/30" />
          <span className="absolute right-[25%] top-[25%] h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-500/30" />
          <span className="absolute bottom-[30%] left-[40%] h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-500/30" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
            {item.label}
          </div>
        ))}
      </div>
    </Card>
  )
}
