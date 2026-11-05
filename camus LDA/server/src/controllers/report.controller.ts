// ReportController -> delega en ReportService y auditoría
import type { Request, Response, NextFunction } from 'express'
import { reportService } from '../services/report.service.js'
import { auditService } from '../services/audit.service.js'

export const reportController = {
  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await reportService.summary())
    } catch (err) {
      next(err)
    }
  },

  async audit(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId =
        typeof req.query.orderId === 'string' ? req.query.orderId.trim() : undefined
      const userIdRaw =
        typeof req.query.userId === 'string' ? Number(req.query.userId) : NaN
      const from = typeof req.query.from === 'string' ? req.query.from : undefined
      const to = typeof req.query.to === 'string' ? req.query.to : undefined
      const limitRaw =
        typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined

      const rows = await auditService.list({
        orderId: orderId || undefined,
        userId: Number.isFinite(userIdRaw) ? userIdRaw : undefined,
        from,
        to,
        limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
      })
      res.json(rows)
    } catch (err) {
      next(err)
    }
  },
}
