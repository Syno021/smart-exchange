import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface StockStatusDataPoint {
  status: string
  count: number
  color?: string
}

export interface StockStatusChartProps {
  data: StockStatusDataPoint[]
  className?: string
  height?: number
}

const STATUS_COLORS: Record<string, string> = {
  active: '#00843D',
  low: '#F59E0B',
  out: '#C8102E',
  inactive: '#9CA3AF',
}

export function StockStatusChart({
  data,
  className,
  height = 280,
}: StockStatusChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="status"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 12,
            }}
            formatter={(value) => [value, 'Products']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={
                  entry.color ??
                  STATUS_COLORS[entry.status.toLowerCase()] ??
                  '#6B7280'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
