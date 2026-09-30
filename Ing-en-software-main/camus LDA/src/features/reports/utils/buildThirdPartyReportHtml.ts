import type { ThirdPartyReportRow } from '@/types'
import { formatDateTime } from '@/utils/formatters'

export function buildThirdPartyReportHtml(rows: ThirdPartyReportRow[]) {
  const generatedAt = formatDateTime(new Date().toISOString())
  const lines = rows
    .map(
      (r) =>
        `<tr><td>${r.orderId}</td><td>${r.client}</td><td>${r.company}</td><td>${r.detail}</td><td>${formatDateTime(r.registeredAt)}</td></tr>`,
    )
    .join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Intervenciones de terceros</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}h1{font-size:1.25rem}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:14px}th{background:#f1f5f9}.meta{color:#64748b;font-size:13px}</style></head>
<body><h1>Reporte — Intervenciones de terceros</h1>
<p class="meta">Generado: ${generatedAt} · Registros incluidos: ${rows.length}</p>
<table><thead><tr><th>OT</th><th>Cliente</th><th>Empresa</th><th>Detalle</th><th>Fecha</th></tr></thead><tbody>${lines}</tbody></table></body></html>`
}
