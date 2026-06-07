import { Gift, Star, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { SkeletonKpi } from '@/components/shared/SkeletonKpi'
import { useCustomerProfile } from '@/portals/customer/hooks/useCustomerProfile'
import type { LoyaltyTier } from '@/types/customer.types'
import { cn } from '@/lib/utils'

const TIER_CONFIG: Record<
  LoyaltyTier,
  { label: string; color: string; bg: string; minPoints: number; next?: LoyaltyTier }
> = {
  bronze: { label: 'Bronze', color: 'text-amber-800', bg: 'bg-amber-100', minPoints: 0, next: 'silver' },
  silver: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-200', minPoints: 500, next: 'gold' },
  gold: { label: 'Gold', color: 'text-yellow-700', bg: 'bg-yellow-100', minPoints: 2000, next: 'platinum' },
  platinum: { label: 'Platinum', color: 'text-purple-700', bg: 'bg-purple-100', minPoints: 5000 },
}

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
}

export function LoyaltyCardPage() {
  const { data: customer, isLoading } = useCustomerProfile()

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <PageHeader title="Loyalty Card" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
      </div>
    )
  }

  const tier = customer?.loyalty_tier ?? 'bronze'
  const config = TIER_CONFIG[tier]
  const points = customer?.loyalty_points ?? 0
  const nextTier = config.next
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : TIER_THRESHOLDS.platinum
  const progress = nextTier
    ? Math.min(100, ((points - config.minPoints) / (nextThreshold - config.minPoints)) * 100)
    : 100

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Loyalty Card" subtitle="Earn points with every purchase" />

      <Card className="mb-6 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <CardContent className="py-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-100">Ubuntu Smart Mart</p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {customer?.full_name ?? 'Member'}
              </h2>
              <Badge className={cn('mt-3', config.bg, config.color)}>
                {config.label} Member
              </Badge>
            </div>
            <Gift className="h-10 w-10 text-brand-200" />
          </div>
          <div className="mt-8">
            <p className="text-sm text-brand-100">Available Points</p>
            <p className="font-display text-4xl font-bold">{points.toLocaleString()}</p>
          </div>
          {nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-brand-100">
                <span>{config.label}</span>
                <span>{TIER_CONFIG[nextTier].label}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-800">
                <div
                  className="h-full rounded-full bg-brand-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-brand-100">
                {nextThreshold - points} points to {TIER_CONFIG[nextTier].label}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-warning-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RandAmount amount={customer?.total_spent ?? 0} className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              Earn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">1 pt / R1</p>
            <p className="text-xs text-gray-500">On completed purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tier Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Exclusive member deals</li>
              <li>• Birthday bonus points</li>
              <li>• Priority checkout</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
