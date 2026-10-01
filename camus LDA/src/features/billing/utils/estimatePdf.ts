import type { CostEstimate } from '@/types'
import { formatCurrency } from '@/utils/formatters'

const TYPE_LABEL: Record<string, string> = {
  insumo: 'Insumo',
  maquinaria: 'Maquinaria',
  combustible: 'Combustible',
  personal: 'Personal',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** HTML imprimible de la estimación para enviar al cliente (RF16 / CU-61) */
export function buildEstimateHtml(estimate: CostEstimate): string {
  const rows = estimate.lines
    .map(
      (l) => `<tr>
        <td>${escapeHtml(TYPE_LABEL[l.type] ?? l.type)}</td>
        <td>${escapeHtml(l.name)}</td>
        <td class="num">${l.quantity} ${escapeHtml(l.unit)}</td>
        <td class="num">${formatCurrency(l.unitPrice)}</td>
        <td class="num">${formatCurrency(l.amount)}</td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Estimación #${estimate.id}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; line-height: 1.45; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .muted { color: #64748b; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { color: #64748b; font-size: 12px; text-transform: uppercase; }
    .num { text-align: right; }
    .totals { margin-top: 16px; margin-left: auto; width: 280px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-size: 18px; font-weight: bold; border-top: 2px solid #0f172a; margin-top: 4px; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>Estimación de servicio #${estimate.id}</h1>
  <p class="muted">Alcantarillados Camus Ltda. · ${escapeHtml(new Date(estimate.createdAt).toLocaleDateString('es-CL'))}</p>
  ${estimate.description ? `<p>${escapeHtml(estimate.description)}</p>` : ''}
  <table>
    <thead><tr><th>Tipo</th><th>Detalle</th><th class="num">Cantidad</th><th class="num">Valor unit.</th><th class="num">Monto</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrency(estimate.subtotal)}</span></div>
    <div><span>IVA (${estimate.taxRate}%)</span><span>${formatCurrency(estimate.tax)}</span></div>
    <div class="grand"><span>Total</span><span>${formatCurrency(estimate.total)}</span></div>
  </div>
  <p class="muted" style="margin-top:24px">Valores referenciales sujetos a confirmación en terreno.</p>
</body>
</html>`
}

export function downloadEstimate(estimate: CostEstimate): void {
  const blob = new Blob([buildEstimateHtml(estimate)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `estimacion-${estimate.id}.html`
  link.click()
  URL.revokeObjectURL(url)
}
