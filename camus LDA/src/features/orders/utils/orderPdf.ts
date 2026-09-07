import type { OrderIntervention, WorkOrder } from '@/types'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'

/** Genera HTML imprimible del resumen de OT (CU-173–176, sin libs PDF) */
export function buildOrderSummaryHtml(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
): string {
  const ops =
    order.operators?.map((o) => o.name).join(', ') ||
    order.technician ||
    'Sin asignar'
  const photos = (order.photoUrls ?? [])
    .map(
      (url) =>
        `<li><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></li>`,
    )
    .join('')
  const thirds = (order.thirdParties ?? [])
    .map(
      (t) =>
        `<li><strong>${escapeHtml(t.company)}</strong>: ${escapeHtml(t.detail)}</li>`,
    )
    .join('')
  const ints = interventions
    .map(
      (i) =>
        `<li>#${i.id} — ${escapeHtml(i.detail)}${i.updatedAt ? ` <em>(act. ${escapeHtml(i.updatedAt)})</em>` : ''}</li>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Resumen OT ${escapeHtml(order.id)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #0f172a; margin: 32px; line-height: 1.45; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin: 24px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; }
    .value { font-size: 14px; font-weight: 600; }
    ul { padding-left: 18px; margin: 0; }
    li { margin: 4px 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #f1f5f9; font-size: 12px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Orden de trabajo ${escapeHtml(order.id)}</h1>
  <p class="meta">Resumen generado ${new Date().toLocaleString('es-CL')} · Camus LDA</p>

  <div class="grid">
    <div><div class="label">Cliente</div><div class="value">${escapeHtml(order.client)}</div></div>
    <div><div class="label">Estado</div><div class="value"><span class="badge">${escapeHtml(order.status)}</span></div></div>
    <div><div class="label">Prioridad</div><div class="value">${escapeHtml(order.priority ?? 'Media')}</div></div>
    <div><div class="label">Incidente</div><div class="value">${escapeHtml(order.incidentType ?? order.category)}</div></div>
    <div><div class="label">Dirección</div><div class="value">${escapeHtml(order.address)}</div></div>
    <div><div class="label">Servicio</div><div class="value">${escapeHtml(order.service ?? '—')}</div></div>
    <div><div class="label">Operadores</div><div class="value">${escapeHtml(ops)}</div></div>
    <div><div class="label">Creada</div><div class="value">${escapeHtml(order.createdAt)}</div></div>
    <div><div class="label">Inicio</div><div class="value">${escapeHtml(formatDisplayDate(order.startDate))}</div></div>
    <div><div class="label">Término</div><div class="value">${escapeHtml(formatDisplayDate(order.endDate))}</div></div>
    <div><div class="label">Duración (h)</div><div class="value">${order.durationHours != null ? order.durationHours : '—'}</div></div>
    <div><div class="label">Progreso</div><div class="value">${order.progress ?? 0}%</div></div>
  </div>

  <h2>Intervenciones</h2>
  ${ints ? `<ul>${ints}</ul>` : '<p class="meta">Sin intervenciones registradas.</p>'}

  <h2>Terceros</h2>
  ${thirds ? `<ul>${thirds}</ul>` : '<p class="meta">Sin intervenciones de terceros.</p>'}

  <h2>Evidencia fotográfica</h2>
  ${photos ? `<ul>${photos}</ul>` : '<p class="meta">Sin fotos registradas.</p>'}

  <script>window.onload = function () { /* listo para imprimir */ }</script>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Abre ventana de vista previa imprimible (CU-173) */
export function previewOrderPdf(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
): void {
  const html = buildOrderSummaryHtml(order, interventions)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}

/** Descarga Blob HTML como archivo (CU-174) — usable como “PDF” vía imprimir */
export function downloadOrderPdf(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
  filename?: string,
): void {
  const html = buildOrderSummaryHtml(order, interventions)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? `resumen-${order.id}.html`
  link.click()
  URL.revokeObjectURL(url)
}

/** Abre diálogo de impresión del navegador (CU-174 / regenerar CU-176) */
export function printOrderPdf(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
): void {
  const html = buildOrderSummaryHtml(order, interventions)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 250)
}
