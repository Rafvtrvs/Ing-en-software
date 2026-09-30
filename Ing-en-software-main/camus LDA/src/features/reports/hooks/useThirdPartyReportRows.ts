import { useMemo } from 'react'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { ThirdPartyReportRow } from '@/types'

export function useThirdPartyReportRows() {
  const orders = useOrdersStore((s) => s.orders)

  const rows = useMemo(() => {
    const list: ThirdPartyReportRow[] = []
    for (const order of orders) {
      for (const tp of order.thirdParties ?? []) {
        list.push({
          id: tp.id,
          orderId: order.id,
          client: order.client,
          company: tp.company,
          detail: tp.detail,
          registeredAt: tp.registeredAt,
        })
      }
    }
    return list.sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    )
  }, [orders])

  const companies = useMemo(
    () => Array.from(new Set(rows.map((r) => r.company))).sort(),
    [rows],
  )

  const orderOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.orderId))), [rows])

  return { rows, companies, orderOptions }
}
