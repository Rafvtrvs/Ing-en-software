// ============================================================
//  EvidenceService — evidencia visual por OT (RF09 / CU-30 a CU-34)
//  Carga, listado, descarga y eliminación de imágenes, con
//  validación de integridad (formato, tamaño y firma del archivo).
// ============================================================
import { prisma } from '../db/prisma.js'
import { storageService } from '../external/storage.service.js'
import { auditService } from './audit.service.js'

export class EvidenceError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'EvidenceError'
    this.status = status
    this.field = field
  }
}

export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024
/** Se puede adjuntar evidencia mientras la OT no esté cancelada o anulada. */
export const UPLOAD_ALLOWED_STATUSES = ['Pendiente', 'En Curso', 'Completada', 'Abonado']

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** CU-34: la firma binaria debe coincidir con el tipo declarado. */
function matchesSignature(mime: string, buf: Buffer): boolean {
  if (mime === 'image/jpeg') {
    return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  }
  if (mime === 'image/png') {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return buf.length > 8 && buf.subarray(0, 8).equals(sig)
  }
  if (mime === 'image/webp') {
    return (
      buf.length > 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    )
  }
  return false
}

export interface EvidenceDto {
  id: number
  orderId: string
  fileName: string
  mimeType: string
  uploadedAt: string
  /** Enlace externo (https) cuando la evidencia no es un archivo subido. */
  externalUrl?: string
}

// Formato de tipoArchivo en BD: "<mime>|<nombre original>"
function toDto(row: {
  id: number
  tipoArchivo: string | null
  fechaCarga: Date
  idOt: string | null
  rutaArchivoUrl?: string | null
}): EvidenceDto {
  const [mimeType = '', ...rest] = (row.tipoArchivo ?? '').split('|')
  const external =
    row.rutaArchivoUrl && /^https?:\/\//i.test(row.rutaArchivoUrl)
      ? row.rutaArchivoUrl
      : undefined
  return {
    id: row.id,
    orderId: row.idOt ?? '',
    mimeType: external ? 'url' : mimeType,
    fileName: rest.join('|') || (external ? 'enlace' : `evidencia-${row.id}`),
    uploadedAt: row.fechaCarga.toISOString(),
    externalUrl: external,
  }
}

async function requireOrder(orderId: string) {
  const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
  if (!order) throw new EvidenceError(404, 'Orden de trabajo no encontrada')
  return order
}

async function requireEvidence(orderId: string, evidenceId: number) {
  const row = await prisma.evidenciaMultimedia.findUnique({ where: { id: evidenceId } })
  if (!row || row.idOt !== orderId) throw new EvidenceError(404, 'Evidencia no encontrada')
  return row
}

export const evidenceService = {
  /** CU-30 + CU-34: valida y almacena una imagen de evidencia. */
  async upload(
    orderId: string,
    input: { fileName?: string; mimeType?: string; data?: string },
    userId?: number,
  ): Promise<EvidenceDto> {
    const order = await requireOrder(orderId)
    if (!UPLOAD_ALLOWED_STATUSES.includes(order.estado)) {
      throw new EvidenceError(
        409,
        'No se puede adjuntar evidencia a una orden cancelada o anulada',
        'estado',
      )
    }

    const mime = String(input.mimeType ?? '').toLowerCase()
    if (!MIME_EXT[mime]) {
      throw new EvidenceError(400, 'Formato no compatible. Use JPG, PNG o WEBP', 'mimeType')
    }
    // Acepta tanto base64 puro como data URL
    const raw = String(input.data ?? '').replace(/^data:[^;]+;base64,/, '')
    if (!raw) throw new EvidenceError(400, 'No se recibió ningún archivo', 'data')
    const buffer = Buffer.from(raw, 'base64')
    if (buffer.length === 0) throw new EvidenceError(400, 'El archivo está vacío', 'data')
    if (buffer.length > MAX_EVIDENCE_BYTES) {
      throw new EvidenceError(413, 'La imagen supera el tamaño máximo de 5 MB', 'data')
    }
    if (!matchesSignature(mime, buffer)) {
      throw new EvidenceError(
        400,
        'El archivo está dañado o no corresponde al formato indicado',
        'data',
      )
    }

    const fileName = (input.fileName ?? '').trim().slice(0, 120) || `evidencia.${MIME_EXT[mime]}`
    const row = await prisma.evidenciaMultimedia.create({
      data: {
        idOt: orderId,
        tipoArchivo: `${mime}|${fileName}`,
        rutaArchivoUrl: `db://evidencia`,
        contenido: buffer,
      },
    })

    await auditService.log({
      modulo: 'evidencia',
      accion: 'cargar_imagen',
      valorNuevo: { orderId, evidenceId: row.id, fileName },
      idUsuario: userId,
    })
    return toDto(row)
  },

  /** Enlace http(s) guardado en Postgres, sin archivo binario. */
  async linkUrl(orderId: string, url: string, userId?: number): Promise<EvidenceDto> {
    await requireOrder(orderId)
    const href = url.trim()
    if (!/^https?:\/\//i.test(href)) {
      throw new EvidenceError(400, 'La URL debe comenzar con http:// o https://', 'url')
    }
    const row = await prisma.evidenciaMultimedia.create({
      data: {
        idOt: orderId,
        tipoArchivo: 'url|enlace',
        rutaArchivoUrl: href,
      },
    })
    await auditService.log({
      modulo: 'evidencia',
      accion: 'cargar_url',
      valorNuevo: { orderId, evidenceId: row.id, url: href },
      idUsuario: userId,
    })
    return toDto(row)
  },

  /** CU-31 */
  async list(orderId: string): Promise<EvidenceDto[]> {
    await requireOrder(orderId)
    const rows = await prisma.evidenciaMultimedia.findMany({
      where: { idOt: orderId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        tipoArchivo: true,
        fechaCarga: true,
        idOt: true,
        rutaArchivoUrl: true,
      },
    })
    return rows.map(toDto)
  },

  /** CU-33: devuelve el archivo original para visualizar/descargar. */
  async getFile(orderId: string, evidenceId: number) {
    const row = await requireEvidence(orderId, evidenceId)
    let content: Buffer | null = null
    if (row.contenido && row.contenido.length > 0) {
      content = Buffer.from(row.contenido)
    } else if (row.rutaArchivoUrl && !row.rutaArchivoUrl.startsWith('db://')) {
      try {
        content = await storageService.read(row.rutaArchivoUrl)
      } catch {
        content = null
      }
    }
    if (!content) throw new EvidenceError(404, 'El archivo no está disponible')
    const dto = toDto(row)
    return { content, mimeType: dto.mimeType, fileName: dto.fileName }
  },

  /** CU-32 */
  async remove(orderId: string, evidenceId: number, userId?: number): Promise<void> {
    const row = await requireEvidence(orderId, evidenceId)
    if (row.rutaArchivoUrl?.startsWith('mock-storage://')) {
      await storageService.remove(row.rutaArchivoUrl).catch(() => undefined)
    }
    await prisma.evidenciaMultimedia.delete({ where: { id: evidenceId } })
    await auditService.log({
      modulo: 'evidencia',
      accion: 'eliminar_imagen',
      valorAnterior: { orderId, evidenceId, fileName: toDto(row).fileName },
      idUsuario: userId,
    })
  },
}
