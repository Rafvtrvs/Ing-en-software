import type { NextFunction, Request, Response } from 'express'

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Recurso no encontrado' })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = (err as { status?: number })?.status ?? 500
  const message = (err as Error)?.message ?? 'Error interno'
  if (status >= 500) console.error('[error]', err)
  res.status(status).json({ error: message })
}
