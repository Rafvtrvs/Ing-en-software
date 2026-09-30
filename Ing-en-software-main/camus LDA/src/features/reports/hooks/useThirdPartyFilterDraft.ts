import { useEffect, useState } from 'react'
import { useReportsStore, type ThirdPartyReportFilters } from '@/store/useReportsStore'
import { useThirdPartyReportRows } from '@/features/reports/hooks/useThirdPartyReportRows'
import type { ThirdPartyReportRow } from '@/types'

const EMPTY: ThirdPartyReportFilters = {
  companyFilter: 'all',
  orderFilter: 'all',
  search: '',
}

function applyFilters(rows: ThirdPartyReportRow[], f: ThirdPartyReportFilters) {
  const q = f.search.toLowerCase().trim()
  return rows.filter((r) => {
    if (f.companyFilter !== 'all' && r.company !== f.companyFilter) return false
    if (f.orderFilter !== 'all' && r.orderId !== f.orderFilter) return false
    if (!q) return true
    return (
      r.company.toLowerCase().includes(q) ||
      r.detail.toLowerCase().includes(q) ||
      r.client.toLowerCase().includes(q) ||
      r.orderId.toLowerCase().includes(q)
    )
  })
}

/** Borrador local + filtros aplicados al pulsar «Filtrar» (CU-159) */
export function useThirdPartyFilterDraft() {
  const applied = useReportsStore((s) => s.thirdPartyFilters)
  const setApplied = useReportsStore((s) => s.setThirdPartyFilters)
  const hasFiltered = useReportsStore((s) => s.thirdPartyHasFiltered)
  const setHasFiltered = useReportsStore((s) => s.setThirdPartyHasFiltered)
  const addToast = useReportsStore((s) => s.addToast)
  const { rows, companies, orderOptions } = useThirdPartyReportRows()

  const [draft, setDraft] = useState<ThirdPartyReportFilters>(applied)

  useEffect(() => {
    setDraft(applied)
  }, [applied])

  const filtered = hasFiltered ? applyFilters(rows, applied) : rows

  const patchDraft = (patch: Partial<ThirdPartyReportFilters>) => {
    setDraft((d) => ({ ...d, ...patch }))
  }

  const applyFilter = () => {
    setApplied(draft)
    setHasFiltered(true)
    const count = applyFilters(rows, draft).length
    addToast(`Filtro aplicado: ${count} registro(s) encontrado(s)`, 'info')
  }

  const clearFilters = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
    setHasFiltered(false)
    addToast('Filtros limpiados', 'info')
  }

  return {
    rows,
    companies,
    orderOptions,
    draft,
    patchDraft,
    applyFilter,
    clearFilters,
    hasFiltered,
    applied,
    filtered,
    /** Registros que usará CU-158 al generar (solo tras filtrar o todos si no filtró) */
    rowsForReport: hasFiltered ? applyFilters(rows, applied) : rows,
  }
}
