// ============================================================
//  Servicio de almacenamiento  ->  Firebase Storage (SIMULADO)
//
//  Firebase Storage requiere plan de pago (Blaze), por eso aquí se
//  implementa un proveedor "mock" que guarda en disco local con la
//  MISMA interfaz que tendría el real. El día que se pague, solo se
//  agrega el proveedor 'firebase' sin cambiar el resto del sistema.
// ============================================================
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { env } from '../config/env.js'

export interface StorageService {
  /** Sube un archivo y devuelve su URL accesible. */
  upload(path: string, content: Buffer | string): Promise<{ url: string }>
}

class MockStorageService implements StorageService {
  private dir = resolve(env.external.storageLocalDir)

  async upload(path: string, content: Buffer | string) {
    await mkdir(this.dir, { recursive: true })
    const safeName = path.replace(/[^\w.-]+/g, '_')
    const fullPath = join(this.dir, safeName)
    await writeFile(fullPath, content)
    // URL simulada equivalente a la que entregaría Firebase Storage
    console.log(`[storage:mock] archivo guardado -> ${fullPath}`)
    return { url: `mock-storage://${safeName}` }
  }
}

export const storageService: StorageService = new MockStorageService()
