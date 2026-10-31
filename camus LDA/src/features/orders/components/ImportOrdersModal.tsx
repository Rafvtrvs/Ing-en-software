import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'
import {
  downloadOrdersImportTemplate,
  parseOrdersImportFile,
  type OrderImportRow,
} from '@/features/orders/utils/importOrdersFromExcel'

type ImportOrdersModalProps = {
  open: boolean
  onClose: () => void
}

export function ImportOrdersModal({ open, onClose }: ImportOrdersModalProps) {
  const addOrder = useOrdersStore((s) => s.addOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const fileRef = useRef<HTMLInputElement>(null)

  const [rows, setRows] = useState<OrderImportRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)

  const valid = rows.filter((r) => r.errors.length === 0)
  const invalid = rows.filter((r) => r.errors.length > 0)

  const reset = () => {
    setRows([])
    setFileName(null)
    setParsing(false)
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (file: File | null) => {
    if (!file) return
    setParsing(true)
    setFileName(file.name)
    try {
      const parsed = await parseOrdersImportFile(file)
      setRows(parsed)
      if (parsed.length === 0) {
        addToast('El archivo no tiene filas de datos', 'info')
      }
    } catch {
      setRows([])
      addToast('No se pudo leer el Excel. Revisá el formato.', 'error')
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (valid.length === 0) return
    setImporting(true)
    let ok = 0
    try {
      for (const row of valid) {
        addOrder(row.payload as WorkOrder)
        ok += 1
      }
      await syncFromApi()
      addToast(
        `Importación lista: ${ok} orden(es)${
          invalid.length ? `, ${invalid.length} fila(s) omitida(s)` : ''
        }`,
      )
      handleClose()
    } catch {
      addToast(`Se importaron ${ok} órdenes; hubo un error al sincronizar`, 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importar órdenes desde Excel"
      description="Subí un .xlsx o .csv con las columnas de la plantilla. Se crearán como OT nuevas."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            leftIcon={<Upload className="h-4 w-4" />}
            disabled={valid.length === 0 || importing || parsing}
            onClick={() => void handleImport()}
          >
            {importing ? 'Importando…' : `Importar ${valid.length || ''}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => downloadOrdersImportTemplate()}
          >
            Descargar plantilla
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? 'Leyendo…' : 'Elegir archivo'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {fileName && (
          <p className="text-xs text-slate-500">
            Archivo: <strong>{fileName}</strong> · {rows.length} fila(s) ·{' '}
            <span className="text-emerald-700">{valid.length} válidas</span>
            {invalid.length > 0 && (
              <>
                {' '}
                · <span className="text-red-600">{invalid.length} con error</span>
              </>
            )}
          </p>
        )}

        <p className="text-xs text-slate-500">
          Importación flexible: usa solo las columnas que existan en el archivo. Los
          campos faltantes se completan solos (ej. Cliente/Dirección no informados,
          Estado Pendiente, Prioridad Media). Filas totalmente vacías se omiten.
        </p>

        {rows.length > 0 && (
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Fila</th>
                  <th className="px-2 py-1.5 font-medium">Cliente</th>
                  <th className="px-2 py-1.5 font-medium">Estado</th>
                  <th className="px-2 py-1.5 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 50).map((r) => (
                  <tr key={r.rowNumber}>
                    <td className="px-2 py-1.5 text-slate-500">{r.rowNumber}</td>
                    <td className="px-2 py-1.5 text-slate-800">
                      {r.payload.client || '—'}
                    </td>
                    <td className="px-2 py-1.5">{r.payload.status}</td>
                    <td className="px-2 py-1.5">
                      {r.errors.length > 0 ? (
                        <span className="text-red-600">{r.errors.join('; ')}</span>
                      ) : r.notes.length > 0 ? (
                        <span className="text-amber-700">{r.notes.join(' · ')}</span>
                      ) : (
                        <span className="text-emerald-700">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="border-t border-slate-100 px-2 py-1.5 text-[11px] text-slate-500">
                Mostrando 50 de {rows.length} filas…
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
