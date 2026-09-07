import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react'
import type { Invoice, KpiData, PaymentRecord } from '@/types'

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'F-2026-0042',
    client: 'Comercial XYZ Ltda.',
    clientRut: '76.543.210-1',
    orderId: 'OT-2026-0128',
    issueDate: '2026-05-18',
    dueDate: '2026-06-18',
    amount: 1850000,
    status: 'Emitida',
  },
  {
    id: 'inv-2',
    number: 'F-2026-0041',
    client: 'Inversiones SpA',
    clientRut: '77.123.456-8',
    orderId: 'OT-2026-0125',
    issueDate: '2026-05-15',
    dueDate: '2026-05-25',
    amount: 920000,
    status: 'Vencida',
  },
  {
    id: 'inv-3',
    number: 'F-2026-0040',
    client: 'Constructora ABC',
    clientRut: '78.901.234-5',
    orderId: 'OT-2026-0120',
    issueDate: '2026-05-10',
    dueDate: '2026-06-10',
    amount: 3450000,
    status: 'Pagada',
    paymentMethod: 'Transferencia',
    paidAt: '2026-05-20',
  },
  {
    id: 'inv-4',
    number: 'F-2026-0039',
    client: 'Aguas Claras Ltda.',
    clientRut: '76.111.222-3',
    orderId: 'OT-2026-0115',
    issueDate: '2026-05-08',
    dueDate: '2026-06-08',
    amount: 1280000,
    status: 'Pagada',
    paymentMethod: 'Transferencia',
    paidAt: '2026-05-14',
  },
  {
    id: 'inv-5',
    number: 'F-2026-0038',
    client: 'Edificio Central',
    clientRut: '79.888.777-6',
    issueDate: '2026-05-05',
    dueDate: '2026-06-05',
    amount: 760000,
    status: 'Emitida',
  },
  {
    id: 'inv-6',
    number: 'F-2026-0037',
    client: 'Municipalidad Lo Barnechea',
    clientRut: '69.170.100-8',
    orderId: 'OT-2026-0108',
    issueDate: '2026-04-28',
    dueDate: '2026-05-28',
    amount: 5200000,
    status: 'Pagada',
    paymentMethod: 'Cheque',
    paidAt: '2026-05-22',
  },
  {
    id: 'inv-7',
    number: 'F-2026-0036',
    client: 'Servicios Hidráulicos Sur',
    clientRut: '76.444.555-9',
    issueDate: '2026-05-20',
    dueDate: '2026-06-20',
    amount: 450000,
    status: 'Borrador',
  },
  {
    id: 'inv-8',
    number: 'F-2026-0035',
    client: 'Condominio Las Palmas',
    clientRut: '77.666.777-0',
    orderId: 'OT-2026-0095',
    issueDate: '2026-04-15',
    dueDate: '2026-05-15',
    amount: 2100000,
    status: 'Anulada',
    notes: 'Anulada por error en montos',
  },
]

export const recentPayments: PaymentRecord[] = [
  {
    id: 'pay-1',
    invoiceNumber: 'F-2026-0040',
    client: 'Constructora ABC',
    amount: 3450000,
    method: 'Transferencia',
    date: '2026-05-20',
  },
  {
    id: 'pay-2',
    invoiceNumber: 'F-2026-0037',
    client: 'Municipalidad Lo Barnechea',
    amount: 5200000,
    method: 'Cheque',
    date: '2026-05-22',
  },
  {
    id: 'pay-3',
    invoiceNumber: 'F-2026-0039',
    client: 'Aguas Claras Ltda.',
    amount: 1280000,
    method: 'Transferencia',
    date: '2026-05-14',
  },
]

export function getBillingKpis(invoices: Invoice[]): KpiData[] {
  const emitidas = invoices.filter((i) => i.status === 'Emitida' || i.status === 'Vencida')
  const pendiente = emitidas.reduce((s, i) => s + i.amount, 0)
  const pagadasMes = invoices
    .filter((i) => i.status === 'Pagada' && i.paidAt?.startsWith('2026-05'))
    .reduce((s, i) => s + i.amount, 0)
  const vencidas = invoices.filter((i) => i.status === 'Vencida').length
  const totalFacturado = invoices
    .filter((i) => i.status !== 'Anulada' && i.status !== 'Borrador')
    .reduce((s, i) => s + i.amount, 0)

  return [
    {
      title: 'Total Facturado',
      value: formatKpiCurrency(totalFacturado),
      trend: '+12% vs mes anterior',
      trendDirection: 'up',
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Por Cobrar',
      value: formatKpiCurrency(pendiente),
      trend: `${emitidas.length} facturas`,
      trendDirection: 'up',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Cobrado en Mayo',
      value: formatKpiCurrency(pagadasMes),
      trend: '+18% vs mes anterior',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Facturas Vencidas',
      value: String(vencidas),
      trend: vencidas > 0 ? 'Requiere gestión' : 'Al día',
      trendDirection: vencidas > 0 ? 'down' : 'up',
      icon: vencidas > 0 ? AlertCircle : CheckCircle,
      iconBg: vencidas > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconColor: vencidas > 0 ? 'text-red-600' : 'text-emerald-600',
    },
  ]
}

function formatKpiCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  return `$${Math.round(value / 1000)}K`
}
