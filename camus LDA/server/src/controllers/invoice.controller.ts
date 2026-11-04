// InvoiceController -> InvoiceService
import type { Request, Response, NextFunction } from 'express'
import { invoiceService } from '../services/invoice.service.js'

function parseId(raw: string) {
  const id = Number(raw)
  if (!Number.isFinite(id)) {
    const err = new Error('ID de factura inválido') as Error & { status: number }
    err.status = 400
    throw err
  }
  return id
}

export const invoiceController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await invoiceService.list())
    } catch (err) {
      next(err)
    }
  },

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50
      res.json(await invoiceService.listPayments(limit))
    } catch (err) {
      next(err)
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.get(parseId(req.params.id))
      if (!invoice) {
        res.status(404).json({ error: 'Factura no encontrada' })
        return
      }
      res.json(invoice)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await invoiceService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await invoiceService.update(
        parseId(req.params.id),
        req.body,
        req.user?.sub,
      )
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await invoiceService.remove(parseId(req.params.id), req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async registerPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.registerPayment(
        parseId(req.params.id),
        req.body,
        req.user?.sub,
      )
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },

  async markAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const method = String(req.body?.method ?? '')
      const result = await invoiceService.markAsPaid(
        parseId(req.params.id),
        method,
        req.user?.sub,
      )
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
