// ============================================================
//  Cola de sincronización de terreno (RF35 / CU-117, CU-118, CU-119)
//  Toda acción del operario (estado, avance, foto) se guarda primero en
//  el dispositivo y luego se envía al servidor. Con conexión se envía
//  de inmediato; sin conexión queda pendiente hasta "Sincronizar".
// ============================================================
import { ordersService } from '@/services/ordersService'
import type { OrderStatus } from '@/types'

export type FieldAction =
  | { kind: 'status'; id: string; orderId: string; at: string; status: OrderStatus; progress?: number }
  | { kind: 'note'; id: string; orderId: string; at: string; detail: string }
  | {
      kind: 'photo'
      id: string
      orderId: string
      at: string
      fileName: string
      mimeType: string
      data: string
    }

export type NewFieldAction =
  | { kind: 'status'; orderId: string; status: OrderStatus; progress?: number }
  | { kind: 'note'; orderId: string; detail: string }
  | { kind: 'photo'; orderId: string; fileName: string; mimeType: string; data: string }

export interface SyncResult {
  synced: number
  failed: { action: FieldAction; message: string }[]
  /** true si se detuvo por falta de conexión */
  offline: boolean
}

const STORAGE_KEY = 'camus_field_queue_v1'

export function loadQueue(): FieldAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FieldAction[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: FieldAction[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    return true
  } catch {
    // Almacenamiento lleno (fotos pesadas)
    return false
  }
}

/** Guarda la acción con la fecha/hora capturada automáticamente (CU-117 paso 4). */
export function enqueue(action: NewFieldAction): { ok: boolean; queued?: FieldAction } {
  const queued = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  } as FieldAction
  const queue = loadQueue()
  queue.push(queued)
  return saveQueue(queue) ? { ok: true, queued } : { ok: false }
}

export function formatStamp(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

function messageOf(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    (err instanceof Error ? err.message : 'Error desconocido')
  )
}

async function send(action: FieldAction) {
  switch (action.kind) {
    case 'status':
      await ordersService.update(action.orderId, {
        status: action.status,
        ...(action.progress !== undefined ? { progress: action.progress } : {}),
      })
      break
    case 'note':
      await ordersService.createIntervention(
        action.orderId,
        `[${formatStamp(action.at)}] ${action.detail}`.slice(0, 255),
      )
      break
    case 'photo':
      await ordersService.uploadEvidenceData(action.orderId, {
        fileName: action.fileName,
        mimeType: action.mimeType,
        data: action.data,
      })
      break
  }
}

/**
 * CU-119: envía en orden las acciones pendientes.
 * - Éxito: se elimina de la cola.
 * - Error de red (sin respuesta) o 5xx: se detiene y deja el resto pendiente.
 * - Rechazo del servidor (4xx): se descarta y se informa (reintentar no lo arreglaría).
 */
async function runFlush(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: [], offline: false }
  let queue = loadQueue()

  while (queue.length > 0) {
    const action = queue[0]
    try {
      await send(action)
      result.synced += 1
    } catch (err) {
      const status = statusOf(err)
      if (status === undefined || status >= 500) {
        result.offline = true
        break
      }
      result.failed.push({ action, message: messageOf(err) })
    }
    queue = queue.slice(1)
    saveQueue(queue)
  }
  return result
}

let flushing: Promise<SyncResult> | null = null

/** Evita envíos duplicados si se dispara a la vez el automático y el manual. */
export function flushQueue(): Promise<SyncResult> {
  if (!flushing) {
    flushing = runFlush().finally(() => {
      flushing = null
    })
  }
  return flushing
}

/** CU-118: reduce la imagen (máx. 1280 px, JPEG 70 %) antes de guardarla/enviarla. */
export function compressImage(
  file: File,
  maxSide = 1280,
  quality = 0.7,
): Promise<{ fileName: string; mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No se pudo procesar la imagen'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
      resolve({
        fileName: `${base}.jpg`,
        mimeType: 'image/jpeg',
        data: canvas.toDataURL('image/jpeg', quality),
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('El archivo no es una imagen válida'))
    }
    img.src = url
  })
}
