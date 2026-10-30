import { jsPDF } from 'jspdf'
import type { OrderIntervention, WorkOrder } from '@/types'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'

/** Genera HTML imprimible del resumen de OT (CU-173 vista previa / impresión) */
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

function line(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
): number {
  doc.setFont('helvetica', 'bold')
  doc.text(label, 14, y)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(value || '—', 120)
  doc.text(lines, 55, y)
  return y + Math.max(7, lines.length * 5 + 2)
}

/** RF-52 / CU-173–176 — PDF binario real del resumen de OT */
export function downloadOrderPdf(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
  filename?: string,
): void {
  const doc = new jsPDF()
  const ops =
    order.operators?.map((o) => o.name).join(', ') ||
    order.technician ||
    'Sin asignar'

  doc.setFontSize(16)
  doc.text(`Orden de trabajo ${order.id}`, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Generado ${new Date().toLocaleString('es-CL')} · Alcantarillados Camus Ltda.`,
    14,
    25,
  )
  doc.setTextColor(0)

  let y = 36
  y = line(doc, 'Cliente', order.client, y)
  y = line(doc, 'Estado', order.status, y)
  y = line(doc, 'Prioridad', order.priority ?? 'Media', y)
  y = line(doc, 'Incidente', order.incidentType ?? order.category, y)
  y = line(doc, 'Direccion', order.address, y)
  y = line(doc, 'Servicio', order.service ?? '—', y)
  y = line(doc, 'Operadores', ops, y)
  y = line(doc, 'Inicio', formatDisplayDate(order.startDate), y)
  y = line(doc, 'Termino', formatDisplayDate(order.endDate), y)
  y = line(
    doc,
    'Duracion',
    order.durationHours != null ? `${order.durationHours} h` : '—',
    y,
  )
  y = line(doc, 'Progreso', `${order.progress ?? 0}%`, y)

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Intervenciones', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  if (interventions.length === 0) {
    doc.text('Sin intervenciones registradas.', 14, y)
    y += 6
  } else {
    for (const item of interventions.slice(0, 12)) {
      const text = doc.splitTextToSize(`#${item.id} — ${item.detail}`, 180)
      doc.text(text, 14, y)
      y += text.length * 5 + 2
      if (y > 270) {
        doc.addPage()
        y = 20
      }
    }
  }

  y += 4
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.text('Terceros', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const thirds = order.thirdParties ?? []
  if (thirds.length === 0) {
    doc.text('Sin intervenciones de terceros.', 14, y)
  } else {
    for (const item of thirds.slice(0, 8)) {
      const text = doc.splitTextToSize(
        `${item.company}: ${item.detail}`,
        180,
      )
      doc.text(text, 14, y)
      y += text.length * 5 + 2
    }
  }

  doc.save(filename ?? `resumen-${order.id}.pdf`)
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
  win.print()
}
