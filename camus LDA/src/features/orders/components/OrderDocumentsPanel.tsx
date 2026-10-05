import { useMemo, useState } from 'react'
import { FileStack, History, Paperclip, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import {
  validateDocumentUrlOrPath,
  validateOrderDocumentFile,
} from '@/features/orders/utils/validateDocument'
import type { OrderDocument, OrderDocumentKind, WorkOrder } from '@/types'

/**
 * RF-40..42: adjuntar / validar / consultar documentos,
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

  const docs = order.documents ?? []
  const [kind, setKind] = useState<OrderDocumentKind>('general')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [mimeType, setMimeType] = useState('application/pdf')
  const [sizeBytes, setSizeBytes] = useState(100_000)
  const [historyDocId, setHistoryDocId] = useState<string | null>(null)
  const [versionTargetId, setVersionTargetId] = useState('')
  const [saving, setSaving] = useState(false)

  const historyDoc = useMemo(
    () => docs.find((d) => d.id === historyDocId) ?? null,
    [docs, historyDocId],
  )

  const handleAttach = () => {
    const name = fileName.trim() || `${title.trim() || 'documento'}.pdf`
    const validation = validateOrderDocumentFile({
      name,
      type: mimeType,
      size: sizeBytes,
    })
    if (!validation.ok) {
      addToast(validation.errors.join(' · '), 'error')
      return
    }
    if (!title.trim()) {
      addToast('Indica un título para el documento', 'error')
      return
    }
    const urlCheck = validateDocumentUrlOrPath(url)
    if (!urlCheck.ok) {
      addToast(urlCheck.errors.join(' · '), 'error')
      return
    }

    setSaving(true)
    try {
      addOrderDocument(order.id, {
        kind,
        title: title.trim(),
        fileName: name,
        url: url.trim(),
        mimeType,
        sizeBytes,
        uploadedBy: user.name ?? 'Usuario',
      })
      setTitle('')
      setUrl('')
      setFileName('')
    } finally {
      setSaving(false)
    }
  }

  const handleNewVersion = (doc: OrderDocument) => {
    const name = fileName.trim() || doc.versions[0]?.fileName || 'documento.pdf'
    const validation = validateOrderDocumentFile({
      name,
      type: mimeType,
      size: sizeBytes,
    })
    if (!validation.ok) {
      addToast(validation.errors.join(' · '), 'error')
      return
    }
    const urlCheck = validateDocumentUrlOrPath(url)
    if (!urlCheck.ok) {
      addToast(urlCheck.errors.join(' · '), 'error')
      return
    }
    addDocumentVersion(order.id, doc.id, {
      fileName: name,
      url: url.trim(),
      mimeType,
      sizeBytes,
      uploadedBy: user.name ?? 'Usuario',
      note: 'Nueva versión',
    })
    setUrl('')
    setVersionTargetId('')
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Documentos de la orden
          </p>
          <p className="text-xs text-slate-500">
            Adjuntos, contratos, reportes y versiones
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
            <FormField label="Nombre de archivo">
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="contrato.pdf"
              />
            </FormField>
            <FormField label="MIME">
              <Select value={mimeType} onChange={(e) => setMimeType(e.target.value)}>
                <option value="application/pdf">PDF</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                  DOCX
                </option>
              </Select>
            </FormField>
            <FormField label="URL / ruta del archivo" className="sm:col-span-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com/docs/contrato.pdf o /uploads/contrato.pdf"
              />
              <p className="mt-1 text-xs text-slate-500">
                Debe ser URL o ruta a un archivo (.pdf, .png, .jpg, .docx, .xlsx…)
              </p>
            </FormField>
            <FormField label="Tamaño (bytes)">
              <Input
                type="number"
                min={1}
                value={sizeBytes}
                onChange={(e) => setSizeBytes(Number(e.target.value) || 0)}
              />
            </FormField>
          </FormGrid>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              leftIcon={<Upload className="h-4 w-4" />}
              disabled={saving}
              onClick={handleAttach}
            >
              {saving ? 'Validando…' : 'Adjuntar documento'}
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
              <li
                key={doc.id}
                className="rounded-lg border border-slate-100 px-3 py-2"
              >
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
                      <span className="text-xs text-slate-500">
                        v{doc.currentVersion}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {current?.fileName} · {current?.uploadedBy} ·{' '}
                      {current
                        ? new Date(current.uploadedAt).toLocaleString('es-CL')
                        : '—'}
                    </p>
                    {current?.url && (
                      <a
                        href={current.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Abrir archivo
                      </a>
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
                        }}
                      >
                        Nueva versión
                      </Button>
                    )}
                  </div>
                </div>

                {versionTargetId === doc.id && canEdit && (
                  <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
                    <FormField label="URL nueva versión" className="min-w-[200px] flex-1">
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://…"
                      />
                    </FormField>
                    <Button type="button" size="sm" onClick={() => handleNewVersion(doc)}>
                      Guardar versión
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setVersionTargetId('')}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                {historyDocId === doc.id && historyDoc && (
                  <ol className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                    {[...historyDoc.versions]
                      .sort((a, b) => b.version - a.version)
                      .map((v) => (
                        <li key={v.version} className="flex flex-wrap gap-x-2">
                          <span className="font-semibold">v{v.version}</span>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {v.fileName}
                          </a>
                          <span>
                            {new Date(v.uploadedAt).toLocaleString('es-CL')} · {v.uploadedBy}
                          </span>
                          {v.note && <span className="text-slate-400">({v.note})</span>}
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
