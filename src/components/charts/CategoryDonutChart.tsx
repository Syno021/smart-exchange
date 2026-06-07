import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { formatRand } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface CategoryDataPoint {
  name: string
  value: number
  color?: string
}

export interface CategoryDonutChartProps {
  data: CategoryDataPoint[]
  className?: string
  height?: number
}

const DEFAULT_COLORS = [
  '#00843D',
  '#33BB73',
  '#00732F',
  '#F59E0B',
  '#C8102E',
  '#1C2B3A',
  '#005C2B',
  '#6B7280',
]

export function CategoryDonutChart({
  data,
  className,
  height = 300,
}: CategoryDonutChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 12,
            }}
            formatter={(value) => [formatRand(Number(value)), 'Revenue']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
