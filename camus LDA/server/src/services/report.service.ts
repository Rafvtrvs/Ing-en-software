// ============================================================
//  ReportService (Lógica del negocio)  -> ReportController
//  Agrega datos de varias tablas para los KPIs y reportes.
// ============================================================
import { prisma } from '../db/prisma.js'

export const reportService = {
  async summary() {
    const [clientes, ordenes, insumos, facturas] = await Promise.all([
      prisma.cliente.count(),
      prisma.ordenTrabajo.count(),
      prisma.insumo.count(),
      prisma.factura.count(),
    ])

    const ordenesPorEstado = await prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      _count: { _all: true },
    })

    const insumosCriticos = await prisma.insumo.count({
      where: { estado: 'Crítico' },
    })

    return {
      totals: { clientes, ordenes, insumos, facturas },
      ordenesPorEstado: ordenesPorEstado.map((g) => ({
        estado: g.estado,
        cantidad: g._count._all,
      })),
      insumosCriticos,
    }
  },
}
