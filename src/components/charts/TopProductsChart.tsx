import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatRand } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface TopProductDataPoint {
  name: string
  revenue: number
  qty?: number
}

export interface TopProductsChartProps {
  data: TopProductDataPoint[]
  className?: string
  height?: number
}

export function TopProductsChart({
  data,
  className,
  height = 320,
}: TopProductsChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 12,
            }}
            formatter={(value, _name, props) => {
              const qty = (props.payload as TopProductDataPoint).qty
              const lines: [string, string][] = [[formatRand(Number(value)), 'Revenue']]
              if (qty != null) lines.push([String(qty), 'Qty Sold'])
              return lines[0]
            }}
          />
          <Bar dataKey="revenue" fill="#00843D" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
