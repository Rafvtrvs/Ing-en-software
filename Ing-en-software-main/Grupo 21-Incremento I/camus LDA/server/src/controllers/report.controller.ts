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

  async audit(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await auditService.list()
      // BigInt no es serializable por JSON.stringify por defecto
      res.json(rows.map((r) => ({ ...r, id: String(r.id) })))
    } catch (err) {
      next(err)
    }
  },
}
