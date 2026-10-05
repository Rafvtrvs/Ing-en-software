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

/** Extensiones de archivo aceptadas en URL / ruta */
const FILE_EXT_RE = /\.(pdf|jpe?g|png|webp|docx?|xlsx?)(?:$|[?#])/i

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

/**
 * Valida que el valor sea URL o ruta de un archivo (no texto libre).
 * Acepta: https://…/archivo.pdf, /uploads/doc.pdf, ./files/x.png, C:\docs\a.pdf
 */
export function validateDocumentUrlOrPath(raw: string): DocumentValidationResult {
  const value = raw.trim()
  if (!value) {
    return { ok: false, errors: ['La URL o ruta del archivo es obligatoria'] }
  }

  // Bloquear esquemas peligrosos o basura
  if (/^(javascript|data|vbscript):/i.test(value)) {
    return { ok: false, errors: ['Esquema de URL no permitido'] }
  }

  // URL http(s) o file:
  if (/^(https?|file):\/\//i.test(value)) {
    try {
      const u = new URL(value)
      const path = decodeURIComponent(u.pathname || '')
      if (!path || path === '/') {
        return {
          ok: false,
          errors: ['La URL debe incluir la ruta de un archivo (ej. …/contrato.pdf)'],
        }
      }
      if (!FILE_EXT_RE.test(path)) {
        return {
          ok: false,
          errors: [
            'La URL debe apuntar a un archivo PDF, imagen u Office (ej. .pdf, .png, .docx)',
          ],
        }
      }
      return { ok: true }
    } catch {
      return { ok: false, errors: ['URL inválida'] }
    }
  }

  // Ruta relativa / absoluta / Windows
  const looksLikePath =
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('uploads/') ||
    value.startsWith('files/') ||
    value.startsWith('docs/') ||
    /^[A-Za-z]:[\\/]/.test(value)

  if (!looksLikePath) {
    return {
      ok: false,
      errors: [
        'Ingresá una URL (https://…/archivo.pdf) o una ruta (ej. /uploads/contrato.pdf)',
      ],
    }
  }

  const pathOnly = value.split(/[?#]/)[0] ?? value
  if (!FILE_EXT_RE.test(pathOnly)) {
    return {
      ok: false,
      errors: [
        'La ruta debe terminar en un archivo válido (.pdf, .jpg, .png, .docx, .xlsx, …)',
      ],
    }
  }

  return { ok: true }
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
