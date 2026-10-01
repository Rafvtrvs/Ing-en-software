/** Validación de adjuntos a OT — RF-40 CU-139 */

export const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024 // 10 MB

export type DocumentValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] }

export function validateOrderDocumentFile(file: {
  name: string
  type: string
  size: number
}): DocumentValidationResult {
  const errors: string[] = []
  if (!file.name?.trim()) errors.push('El nombre del archivo es obligatorio')
  if (file.size <= 0) errors.push('El archivo está vacío')
  if (file.size > MAX_DOCUMENT_BYTES) {
    errors.push('El archivo supera el máximo de 10 MB')
  }
  const mime = file.type || guessMimeFromName(file.name)
  if (!ALLOWED_DOCUMENT_MIME.includes(mime as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
    errors.push('Formato no permitido (PDF, imágenes o Office)')
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}

function guessMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'xls':
      return 'application/vnd.ms-excel'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    default:
      return ''
  }
}
