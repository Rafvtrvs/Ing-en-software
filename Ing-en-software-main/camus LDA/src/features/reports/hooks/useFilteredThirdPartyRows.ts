import { useMemo } from 'react'
import { useReportsStore } from '@/store/useReportsStore'
import { useThirdPartyReportRows } from '@/features/reports/hooks/useThirdPartyReportRows'

export function useFilteredThirdPartyRows() {
  const { rows, companies, orderOptions } = useThirdPartyReportRows()
  const filters = useReportsStore((s) => s.thirdPartyFilters)

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    return rows.filter((r) => {
      if (filters.companyFilter !== 'all' && r.company !== filters.companyFilter) return false
      if (filters.orderFilter !== 'all' && r.orderId !== filters.orderFilter) return false
      if (!q) return true
      return (
        r.company.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q)
      )
    })
  }, [rows, filters])

  return { filtered, companies, orderOptions, filters }
}
