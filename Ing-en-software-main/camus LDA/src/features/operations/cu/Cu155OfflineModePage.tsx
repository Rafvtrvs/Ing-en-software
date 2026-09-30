import { useNavigate } from 'react-router-dom'
import { CloudOff, Wifi, WifiOff } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { ROUTES } from '@/constants/routes'
import { useOperationsStore } from '@/store/useOperationsStore'

/** RF46 — CU-155: Operar sin conexión a internet */
export function Cu155OfflineModePage() {
  const navigate = useNavigate()
  const offlineMode = useOperationsStore((s) => s.offlineMode)
  const setOfflineMode = useOperationsStore((s) => s.setOfflineMode)
  const toasts = useOperationsStore((s) => s.toasts)
  const removeToast = useOperationsStore((s) => s.removeToast)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Operaciones en Terreno"
          subtitle="Vista dedicada al caso de uso CU-155."
          action={
            <Button variant="outline" onClick={() => navigate(ROUTES.OPERACIONES)}>
              Volver al panel general
            </Button>
          }
        />

        <CuPageBanner
          rf="RF46"
          rfTitle="Registro sin conexión y sincronización"
          cu="CU-155"
          cuTitle="Registrar información sin conexión a internet"
        />

        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {offlineMode ? (
                <WifiOff className="mt-1 h-6 w-6 text-amber-600" />
              ) : (
                <Wifi className="mt-1 h-6 w-6 text-emerald-600" />
              )}
              <div>
                <p className="font-medium text-slate-900">
                  {offlineMode ? 'Sin conexión — modo activo' : 'Con conexión — modo en línea'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Active el interruptor para simular pérdida de internet. Los registros de OT (RF43) se
                  almacenarán temporalmente en el dispositivo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
              <Switch checked={offlineMode} onChange={setOfflineMode} id="cu155-offline" />
              <label htmlFor="cu155-offline" className="text-sm font-medium text-slate-700">
                Modo sin conexión
              </label>
            </div>
          </div>
          {offlineMode && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
              No hay conexión a internet. La información ingresada se almacenará temporalmente en el
              dispositivo hasta ejecutar la sincronización (CU-156).
            </div>
          )}
        </Card>
      </div>
      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
