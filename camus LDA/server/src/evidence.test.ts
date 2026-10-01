import { describe, it, expect, beforeEach, vi } from 'vitest'
import { evidenceService } from './services/evidence.service'
import { prisma } from './db/prisma'
import { auditService } from './services/audit.service'
import { storageService } from './external/storage.service'

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('datos-de-prueba'),
])
const pngB64 = PNG.toString('base64')

describe('EvidenceService - RF09 (CU-30 a CU-34)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue({ id: 'OT-1', estado: 'En Curso' })
    // @ts-ignore
    prisma.evidenciaMultimedia.create = vi.fn().mockImplementation(async ({ data }) => ({
      id: 7,
      fechaCarga: new Date('2026-05-01T10:00:00Z'),
      ...data,
    }))
    storageService.upload = vi.fn().mockResolvedValue({ url: 'mock-storage://x.png' })
    storageService.remove = vi.fn().mockResolvedValue(undefined)
  })

  it('CU-30: carga una imagen válida y la vincula a la orden', async () => {
    const dto = await evidenceService.upload('OT-1', {
      fileName: 'foto.png',
      mimeType: 'image/png',
      data: `data:image/png;base64,${pngB64}`,
    })
    expect(dto).toMatchObject({ id: 7, orderId: 'OT-1', fileName: 'foto.png', mimeType: 'image/png' })
    expect(storageService.upload).toHaveBeenCalledOnce()
    expect(auditService.log).toHaveBeenCalled()
  })

  it('CU-30: rechaza órdenes que no están en ejecución ni finalizadas', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue({ id: 'OT-1', estado: 'Pendiente' })
    await expect(
      evidenceService.upload('OT-1', { mimeType: 'image/png', data: pngB64 }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('CU-30: rechaza formatos no compatibles', async () => {
    await expect(
      evidenceService.upload('OT-1', { mimeType: 'application/pdf', data: pngB64 }),
    ).rejects.toMatchObject({ status: 400, field: 'mimeType' })
  })

  it('CU-34: rechaza archivos cuya firma no coincide con el formato', async () => {
    await expect(
      evidenceService.upload('OT-1', {
        mimeType: 'image/png',
        data: Buffer.from('esto no es una imagen').toString('base64'),
      }),
    ).rejects.toMatchObject({ status: 400, field: 'data' })
  })

  it('CU-34: rechaza imágenes sobre 5 MB', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]).toString('base64')
    await expect(
      evidenceService.upload('OT-1', { mimeType: 'image/png', data: big }),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('CU-31: lista las evidencias de la orden', async () => {
    // @ts-ignore
    prisma.evidenciaMultimedia.findMany = vi.fn().mockResolvedValue([
      { id: 1, idOt: 'OT-1', tipoArchivo: 'image/jpeg|a.jpg', fechaCarga: new Date() },
    ])
    const list = await evidenceService.list('OT-1')
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ fileName: 'a.jpg', mimeType: 'image/jpeg' })
  })

  it('CU-33: devuelve el archivo original', async () => {
    // @ts-ignore
    prisma.evidenciaMultimedia.findUnique = vi.fn().mockResolvedValue({
      id: 1,
      idOt: 'OT-1',
      tipoArchivo: 'image/png|a.png',
      rutaArchivoUrl: 'mock-storage://x.png',
      fechaCarga: new Date(),
    })
    storageService.read = vi.fn().mockResolvedValue(PNG)
    const file = await evidenceService.getFile('OT-1', 1)
    expect(file.content).toEqual(PNG)
    expect(file.mimeType).toBe('image/png')
  })

  it('CU-32: elimina archivo y registro; 404 si la evidencia es de otra orden', async () => {
    // @ts-ignore
    prisma.evidenciaMultimedia.findUnique = vi.fn().mockResolvedValue({
      id: 1,
      idOt: 'OT-1',
      tipoArchivo: 'image/png|a.png',
      rutaArchivoUrl: 'mock-storage://x.png',
      fechaCarga: new Date(),
    })
    // @ts-ignore
    prisma.evidenciaMultimedia.delete = vi.fn().mockResolvedValue({})
    await evidenceService.remove('OT-1', 1, 3)
    expect(storageService.remove).toHaveBeenCalledWith('mock-storage://x.png')
    expect(prisma.evidenciaMultimedia.delete).toHaveBeenCalledWith({ where: { id: 1 } })

    await expect(evidenceService.remove('OT-2', 1)).rejects.toMatchObject({ status: 404 })
  })
})
