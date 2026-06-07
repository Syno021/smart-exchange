import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatRand } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface RevenueLineChartProps {
  data: RevenueDataPoint[]
  className?: string
  height?: number
}

export function RevenueLineChart({
  data,
  className,
  height = 300,
}: RevenueLineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 12,
            }}
            formatter={(value) => [formatRand(Number(value)), 'Revenue']}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#00843D"
            strokeWidth={2}
            dot={{ fill: '#00843D', r: 3 }}
            activeDot={{ r: 5, fill: '#005C2B' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
