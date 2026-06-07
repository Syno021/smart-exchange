import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Package, Truck, CheckCircle2 } from 'lucide-react'
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart'
import { SalesBarChart } from '@/components/charts/SalesBarChart'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { SkeletonKpi } from '@/components/shared/SkeletonKpi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useSupplierProfile } from '@/portals/supplier/hooks/useSupplierProfile'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { PO_STATUS_LABELS } from '@/lib/constants'
import { formatRand, toNumber } from '@/lib/utils'
import type { PurchaseOrder } from '@/types/order.types'

export function DashboardPage() {
  const { data: supplier } = useSupplierProfile()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['supplier', 'orders', supplier?.supplier_id],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getAll({ per_page: 100 })
      return data.data
    },
    enabled: !!supplier,
  })

  const kpis = useMemo(() => {
    const list = orders ?? []
    return {
      total: list.length,
      pending: list.filter((o) => ['submitted', 'approved'].includes(o.status)).length,
      shipped: list.filter((o) => o.status === 'shipped').length,
      received: list.filter((o) => o.status === 'received').length,
      totalValue: list.reduce((s, o) => s + toNumber(o.total_amt), 0),
    }
  }, [orders])

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const po of orders ?? []) {
      counts[po.status] = (counts[po.status] ?? 0) + toNumber(po.total_amt)
    }
    return Object.entries(counts).map(([status, value]) => ({
      name: PO_STATUS_LABELS[status as keyof typeof PO_STATUS_LABELS] ?? status,
      value,
    }))
  }, [orders])

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {}
    for (const po of orders ?? []) {
      const month = new Date(po.created_at).toLocaleString('en-ZA', { month: 'short' })
      months[month] = (months[month] ?? 0) + 1
    }
    return Object.entries(months).map(([label, sales]) => ({ label, sales }))
  }, [orders])

  const recentOrders = (orders ?? []).slice(0, 5)

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Supplier Dashboard"
        subtitle={supplier ? `${supplier.company_name} overview` : 'Loading…'}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total POs" value={kpis.total} icon={ClipboardList} colorScheme="blue" index={0} />
          <KpiCard title="Awaiting Shipment" value={kpis.pending} icon={Package} colorScheme="amber" index={1} />
          <KpiCard title="In Transit" value={kpis.shipped} icon={Truck} colorScheme="green" index={2} />
          <KpiCard
            title="Delivered"
            value={kpis.received}
            subtitle={formatRand(kpis.totalValue)}
            icon={CheckCircle2}
            colorScheme="green"
            index={3}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PO Volume by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <SalesBarChart data={monthlyData} height={260} />
            ) : (
              <p className="py-12 text-center text-sm text-gray-500">No purchase order data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Value by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <CategoryDonutChart data={statusChartData} height={260} />
            ) : (
              <p className="py-12 text-center text-sm text-gray-500">No purchase order data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentOrders.map((po: PurchaseOrder) => (
                <li key={po.po_id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-mono text-gray-900">{po.po_ref}</span>
                  <span className="capitalize text-gray-500">{po.status}</span>
                  <span className="font-mono">{formatRand(po.total_amt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
