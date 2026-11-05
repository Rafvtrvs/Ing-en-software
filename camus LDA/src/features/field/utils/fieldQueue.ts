// ============================================================
//  Cola de sincronización de terreno (RF35 / CU-117–119 / RF46)
// ============================================================
import { ordersService } from '@/services/ordersService'
import type { OfflineSyncEntry, OrderStatus, WorkOrder } from '@/types'

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
  | {
      kind: 'create-order'
      id: string
      orderId: string
      at: string
      order: WorkOrder
      notes?: string
    }

export type NewFieldAction =
  | { kind: 'status'; orderId: string; status: OrderStatus; progress?: number }
  | { kind: 'note'; orderId: string; detail: string }
  | { kind: 'photo'; orderId: string; fileName: string; mimeType: string; data: string }
  | { kind: 'create-order'; order: WorkOrder; notes?: string }
  | { kind: 'start-service'; orderId: string }
  | { kind: 'finish-service'; orderId: string; clientSignature: string }

export interface SyncResult {
  synced: number
  failed: { action: FieldAction; message: string }[]
  offline: boolean
}

const STORAGE_KEY = 'camus_field_queue_v1'
const LOG_KEY = 'camus_field_sync_log_v1'
const QUEUE_EVENT = 'camus-field-queue'
const LOG_LIMIT = 40

function emitQueueChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(QUEUE_EVENT))
  }
}

export function subscribeFieldQueue(listener: () => void): () => void {
  window.addEventListener(QUEUE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(QUEUE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

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
    emitQueueChange()
    return true
  } catch {
    return false
  }
}

function loadLog(): OfflineSyncEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? (JSON.parse(raw) as OfflineSyncEntry[]) : []
  } catch {
    return []
  }
}

function saveLog(entries: OfflineSyncEntry[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, LOG_LIMIT)))
  emitQueueChange()
}

function appendLog(entry: OfflineSyncEntry) {
  saveLog([entry, ...loadLog()].slice(0, LOG_LIMIT))
}

export function describeFieldAction(action: FieldAction): { module: string; summary: string } {
  switch (action.kind) {
    case 'status':
      return {
        module: 'Órdenes',
        summary: `${action.orderId}: estado → ${action.status}`,
      }
    case 'note':
      return {
        module: 'Intervenciones',
        summary: `${action.orderId}: ${action.detail.slice(0, 80)}${action.detail.length > 80 ? '…' : ''}`,
      }
    case 'photo':
      return {
        module: 'Evidencia',
        summary: `${action.orderId}: foto ${action.fileName}`,
      }
    case 'create-order':
      return {
        module: 'Órdenes',
        summary: `Nueva OT ${action.orderId} — ${action.order.client}${action.notes ? ` · ${action.notes.slice(0, 40)}` : ''}`,
      }
    default:
      return { module: 'Terreno', summary: 'Acción pendiente' }
  }
}

/** Vista unificada: pendientes de la cola + historial reciente de sync. */
export function getFieldSyncEntries(): OfflineSyncEntry[] {
  const pending = loadQueue().map((action) => {
    const meta = describeFieldAction(action)
    return {
      id: action.id,
      module: meta.module,
      summary: meta.summary,
      status: 'pendiente' as const,
      createdAt: action.at,
    }
  })
  const history = loadLog().filter((e) => !pending.some((p) => p.id === e.id))
  return [...pending, ...history]
}

/** Guarda la acción con la fecha/hora capturada automáticamente (CU-117 paso 4). */
export function enqueue(action: NewFieldAction): { ok: boolean; queued?: FieldAction } {
  if (action.kind === 'start-service' || action.kind === 'finish-service') {
    return { ok: false }
  }
  const queued = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...(action.kind === 'create-order'
      ? { orderId: action.order.id }
      : {}),
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
    case 'create-order': {
      const payload = { ...action.order }
      if (action.notes?.trim()) {
        payload.service = payload.service
          ? `${payload.service} — ${action.notes.trim()}`
          : action.notes.trim()
      }
      await ordersService.create(payload)
      break
    }
  }
}

async function runFlush(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: [], offline: false }
  let queue = loadQueue()

  while (queue.length > 0) {
    const action = queue[0]
    const meta = describeFieldAction(action)
    try {
      await send(action)
      result.synced += 1
      appendLog({
        id: action.id,
        module: meta.module,
        summary: meta.summary,
        status: 'sincronizado',
        createdAt: action.at,
        syncedAt: new Date().toISOString(),
      })
    } catch (err) {
      const status = statusOf(err)
      if (status === undefined || status >= 500) {
        result.offline = true
        break
      }
      const message = messageOf(err)
      result.failed.push({ action, message })
      appendLog({
        id: action.id,
        module: meta.module,
        summary: meta.summary,
        status: 'error',
        createdAt: action.at,
        errorMessage: message,
      })
    }
    queue = queue.slice(1)
    saveQueue(queue)
  }
  return result
}

let flushing: Promise<SyncResult> | null = null

export function flushQueue(): Promise<SyncResult> {
  if (!flushing) {
    flushing = runFlush().finally(() => {
      flushing = null
    })
  }
  return flushing
}

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
