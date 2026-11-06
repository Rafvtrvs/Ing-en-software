import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileStack, History, Paperclip, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { ordersService } from '@/services/ordersService'
import { validateOrderDocumentFile } from '@/features/orders/utils/validateDocument'
import { isDemoMode, isOfflineApiError } from '@/utils/demoMode'
import type { OrderDocument, OrderDocumentKind, WorkOrder } from '@/types'

const MAX_PDF_BYTES = 10 * 1024 * 1024

function isPdfFile(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return type === 'application/pdf' || name.endsWith('.pdf')
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * RF-40..42: adjuntar / validar / consultar documentos PDF,
 * contratos y reportes, con versionado.
 */
export function OrderDocumentsPanel({
  order,
  canEdit,
}: {
  order: WorkOrder
  canEdit: boolean
}) {
  const user = useSessionUser()
  const addOrderDocument = useOrdersStore((s) => s.addOrderDocument)
  const addDocumentVersion = useOrdersStore((s) => s.addDocumentVersion)
  const addToast = useOrdersStore((s) => s.addToast)

  const [serverDocs, setServerDocs] = useState<OrderDocument[] | null>(null)
  const docs = serverDocs ?? order.documents ?? []

  const loadDocs = useCallback(async () => {
    try {
      const rows = await ordersService.listOrderDocuments(order.id)
      setServerDocs(
        rows.map((row) => ({
          id: String(row.id),
          orderId: order.id,
          kind: (row.tipo as OrderDocumentKind) || 'general',
          title: row.titulo,
          currentVersion: row.versionActual,
          createdAt: row.fechaCarga,
          versions: [
            {
              version: row.versionActual,
              fileName: row.nombreArchivo,
              url: `db://${row.id}`,
              mimeType: row.mimeType || 'application/pdf',
              sizeBytes: row.tamanioBytes,
              uploadedAt: row.fechaCarga,
              uploadedBy: row.subidoPor ?? 'Usuario',
              note: row.nota ?? undefined,
            },
          ],
        })),
      )
    } catch {
      setServerDocs(null)
    }
  }, [order.id])

  useEffect(() => {
    void loadDocs()
  }, [loadDocs])
  const [kind, setKind] = useState<OrderDocumentKind>('general')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [historyDocId, setHistoryDocId] = useState<string | null>(null)
  const [versionTargetId, setVersionTargetId] = useState('')
  const [versionFile, setVersionFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const versionInputRef = useRef<HTMLInputElement>(null)

  const historyDoc = useMemo(
    () => docs.find((d) => d.id === historyDocId) ?? null,
    [docs, historyDocId],
  )

  const handlePickFile = (picked?: File | null) => {
    if (!picked) {
      setFile(null)
      return
    }
    if (!isPdfFile(picked)) {
      addToast('Solo se permiten archivos PDF', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFile(null)
      return
    }
    if (picked.size > MAX_PDF_BYTES) {
      addToast('El PDF supera el máximo de 10 MB', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFile(null)
      return
    }
    setFile(picked)
  }

  const handleAttach = async () => {
    if (!title.trim()) {
      addToast('Indica un título para el documento', 'error')
      return
    }
    if (!file) {
      addToast('Selecciona un archivo PDF', 'error')
      return
    }
    const validation = validateOrderDocumentFile({
      name: file.name,
      type: file.type || 'application/pdf',
      size: file.size,
    })
    if (!validation.ok) {
      addToast(validation.errors.join(' · '), 'error')
      return
    }

    setSaving(true)
    try {
      let url = ''
      let docId = ''
      try {
        const created = await ordersService.uploadOrderDocument(order.id, {
          title: title.trim(),
          kind,
          file,
          uploadedBy: user.name ?? 'Usuario',
        })
        url = created.urlArchivo
        docId = String(created.id)
        await loadDocs()
        setTitle('')
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        addToast('Documento adjunto correctamente')
        return
      } catch (err) {
        if (!(isDemoMode() || isOfflineApiError(err))) {
          throw err
        }
        // Fallback local: data URL para poder abrir el PDF en esta sesión
        url = await fileToDataUrl(file)
      }

      addOrderDocument(order.id, {
        id: docId || undefined,
        kind,
        title: title.trim(),
        fileName: file.name,
        url,
        mimeType: 'application/pdf',
        sizeBytes: file.size,
        uploadedBy: user.name ?? 'Usuario',
      })
      setTitle('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo adjuntar el PDF'
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleNewVersion = async (doc: OrderDocument) => {
    if (!versionFile) {
      addToast('Selecciona un PDF para la nueva versión', 'error')
      return
    }
    if (!isPdfFile(versionFile)) {
      addToast('Solo se permiten archivos PDF', 'error')
      return
    }
    if (versionFile.size > MAX_PDF_BYTES) {
      addToast('El PDF supera el máximo de 10 MB', 'error')
      return
    }

    setSaving(true)
    try {
      let url = ''
      const apiId = /^\d+$/.test(doc.id) ? doc.id : null

      try {
        if (apiId) {
          const updated = await ordersService.uploadDocumentVersion(apiId, {
            file: versionFile,
            uploadedBy: user.name ?? 'Usuario',
            note: 'Nueva versión',
          })
          url = updated.urlArchivo
          await loadDocs()
          setVersionFile(null)
          setVersionTargetId('')
          if (versionInputRef.current) versionInputRef.current.value = ''
          addToast(`Versión ${updated.versionActual} guardada`)
          return
        } else {
          throw new Error('offline')
        }
      } catch (err) {
        if (!(isDemoMode() || isOfflineApiError(err) || (err as Error).message === 'offline')) {
          throw err
        }
        url = await fileToDataUrl(versionFile)
      }

      addDocumentVersion(order.id, doc.id, {
        fileName: versionFile.name,
        url,
        mimeType: 'application/pdf',
        sizeBytes: versionFile.size,
        uploadedBy: user.name ?? 'Usuario',
        note: 'Nueva versión',
      })
      setVersionFile(null)
      setVersionTargetId('')
      if (versionInputRef.current) versionInputRef.current.value = ''
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo guardar la versión'
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const openDocument = async (doc: OrderDocument, versionUrl: string) => {
    if (
      versionUrl.startsWith('data:') ||
      versionUrl.startsWith('blob:') ||
      versionUrl.startsWith('http')
    ) {
      window.open(versionUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (!/^\d+$/.test(doc.id)) {
      addToast('No se pudo abrir el archivo', 'error')
      return
    }
    try {
      const blob = await ordersService.fetchOrderDocumentFile(order.id, doc.id)
      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch {
      addToast('No se pudo abrir el PDF', 'error')
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Documentos de la orden</p>
          <p className="text-xs text-slate-500">
            Adjuntos PDF, contratos, reportes y versiones
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="mb-4 space-y-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3">
          <FormGrid cols={2}>
            <FormField label="Tipo">
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as OrderDocumentKind)}
              >
                <option value="general">Documento general</option>
                <option value="contrato">Contrato</option>
                <option value="reporte">Reporte</option>
              </Select>
            </FormField>
            <FormField label="Título">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Contrato firmado"
              />
            </FormField>
            <FormField label="Archivo PDF" className="sm:col-span-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
                onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-slate-500">
                {file
                  ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB`
                  : 'Selecciona un PDF (máx. 10 MB)'}
              </p>
            </FormField>
          </FormGrid>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              leftIcon={<Upload className="h-4 w-4" />}
              disabled={saving}
              onClick={() => void handleAttach()}
            >
              {saving ? 'Subiendo…' : 'Adjuntar PDF'}
            </Button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          Sin documentos asociados a esta orden.
        </p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => {
            const current = doc.versions.find((v) => v.version === doc.currentVersion)
            return (
              <li key={doc.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{doc.title}</span>
                      <Badge
                        label={
                          doc.kind === 'contrato'
                            ? 'Contrato'
                            : doc.kind === 'reporte'
                              ? 'Reporte'
                              : 'General'
                        }
                      />
                      <span className="text-xs text-slate-500">v{doc.currentVersion}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {current?.fileName} · {current?.uploadedBy} ·{' '}
                      {current
                        ? new Date(current.uploadedAt).toLocaleString('es-CL')
                        : '—'}
                    </p>
                    {current?.url && (
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => void openDocument(doc, current.url)}
                      >
                        Abrir PDF
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      leftIcon={<History className="h-3.5 w-3.5" />}
                      onClick={() =>
                        setHistoryDocId((id) => (id === doc.id ? null : doc.id))
                      }
                    >
                      Versiones
                    </Button>
                    {canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        leftIcon={<FileStack className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setVersionTargetId(doc.id)
                          setKind(doc.kind)
                          setTitle(doc.title)
                          setVersionFile(null)
                        }}
                      >
                        Nueva versión
                      </Button>
                    )}
                  </div>
                </div>

                {versionTargetId === doc.id && canEdit && (
                  <div className="mt-2 space-y-2 rounded-md bg-slate-50 p-2">
                    <FormField label="Nueva versión (PDF)">
                      <input
                        ref={versionInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                        onChange={(e) => {
                          const picked = e.target.files?.[0] ?? null
                          if (picked && !isPdfFile(picked)) {
                            addToast('Solo se permiten archivos PDF', 'error')
                            e.target.value = ''
                            setVersionFile(null)
                            return
                          }
                          setVersionFile(picked)
                        }}
                      />
                      {versionFile ? (
                        <p className="mt-1 text-xs text-slate-500">{versionFile.name}</p>
                      ) : null}
                    </FormField>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={saving}
                        onClick={() => void handleNewVersion(doc)}
                      >
                        Guardar versión
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVersionTargetId('')
                          setVersionFile(null)
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {historyDocId === doc.id && historyDoc && (
                  <ol className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                    {[...historyDoc.versions]
                      .sort((a, b) => b.version - a.version)
                      .map((v) => (
                        <li key={v.version} className="flex flex-wrap gap-x-2">
                          <span className="font-semibold">v{v.version}</span>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => void openDocument(doc, v.url)}
                          >
                            {v.fileName}
                          </button>
                          <span>
                            {new Date(v.uploadedAt).toLocaleString('es-CL')} · {v.uploadedBy}
                          </span>
                        </li>
                      ))}
                  </ol>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
