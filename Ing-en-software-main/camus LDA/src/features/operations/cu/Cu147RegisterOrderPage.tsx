import { useNavigate } from 'react-router-dom'
import { ClipboardList, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'
import { useFieldOrderRegister } from '@/features/operations/hooks/useFieldOrderRegister'

/** RF43 — CU-147: Registrar orden de trabajo en terreno (vista informe) */
export function Cu147RegisterOrderPage() {
  const navigate = useNavigate()
  const { suggestedId, currentUser, offlineMode } = useFieldOrderRegister()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operaciones en Terreno"
        subtitle="Vista dedicada al caso de uso CU-147."
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.OPERACIONES)}>
            Volver al panel general
          </Button>
        }
      />

      <CuPageBanner
        rf="RF43"
        rfTitle="Registro de orden de trabajo en terreno"
        cu="CU-147"
        cuTitle="Registrar orden de trabajo"
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Operador en terreno: <strong>{currentUser.name ?? 'Operador'}</strong>
            {offlineMode && (
              <p className="mt-2 text-blue-800">
                Modo sin conexión activo (RF46). Los datos se almacenarán localmente hasta sincronizar.
              </p>
            )}
          </div>
          <p className="text-sm text-slate-600">
            Inicie el registro de una nueva orden de trabajo desde el lugar del servicio. El identificador
            se asignará al confirmar el formulario del CU-148.
          </p>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-slate-500">Identificador sugerido</p>
              <p className="font-semibold text-slate-900">{suggestedId}</p>
            </div>
            <MapPin className="ml-auto h-5 w-5 text-slate-400" />
          </div>
          <Button className="w-full sm:w-auto" onClick={() => navigate(ROUTES.CU148)}>
            Continuar al CU-148 — Completar formulario
          </Button>
        </div>
      </Card>
    </div>
  )
}
