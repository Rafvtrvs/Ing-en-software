// ============================================================
//  Servicio de almacenamiento  ->  Firebase Storage (SIMULADO)
//
//  Firebase Storage requiere plan de pago (Blaze), por eso aquí se
//  implementa un proveedor "mock" que guarda en disco local con la
//  MISMA interfaz que tendría el real. El día que se pague, solo se
//  agrega el proveedor 'firebase' sin cambiar el resto del sistema.
// ============================================================
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { env } from '../config/env.js'

export interface StorageService {
  /** Sube un archivo y devuelve su URL accesible. */
  upload(path: string, content: Buffer | string): Promise<{ url: string }>
  /** Lee el contenido de un archivo a partir de la URL devuelta por upload. */
  read(url: string): Promise<Buffer>
  /** Elimina el archivo asociado a la URL (no falla si ya no existe). */
  remove(url: string): Promise<void>
}

const MOCK_PREFIX = 'mock-storage://'

class MockStorageService implements StorageService {
  private dir = resolve(env.external.storageLocalDir)

  async upload(path: string, content: Buffer | string) {
    await mkdir(this.dir, { recursive: true })
    const safeName = path.replace(/[^\w.-]+/g, '_')
    const fullPath = join(this.dir, safeName)
    await writeFile(fullPath, content)
    // URL simulada equivalente a la que entregaría Firebase Storage
    console.log(`[storage:mock] archivo guardado -> ${fullPath}`)
    return { url: `${MOCK_PREFIX}${safeName}` }
  }

  private resolveUrl(url: string) {
    if (!url.startsWith(MOCK_PREFIX)) throw new Error('URL de almacenamiento inválida')
    // Mismo saneado que upload: evita path traversal
    const name = url.slice(MOCK_PREFIX.length).replace(/[^\w.-]+/g, '_')
    return join(this.dir, name)
  }

  async read(url: string) {
    return readFile(this.resolveUrl(url))
  }

  async remove(url: string) {
    await rm(this.resolveUrl(url), { force: true })
  }
}

export const storageService: StorageService = new MockStorageService()
