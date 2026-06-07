import { Building2, Percent, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@/components'
import { APP_NAME, CURRENCY, STORE_ADDRESS, TAX_RATE } from '@/lib/constants'

export function SettingsPage() {
  const taxPercent = (TAX_RATE * 100).toFixed(0)

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Store configuration and system constants"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-brand-600" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Store Name
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-gray-900">{APP_NAME}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Address
              </p>
              <p className="mt-1 flex items-start gap-2 text-sm text-gray-700">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                {STORE_ADDRESS}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Currency
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {CURRENCY} (South African Rand)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-brand-600" />
              Tax Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                VAT / Tax Rate
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-700">
                {taxPercent}%
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Applied to taxable sales at point of sale. Configured via{' '}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">VITE_TAX_RATE</code>{' '}
                environment variable.
              </p>
            </div>
            <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
              <p className="text-sm text-brand-800">
                Current rate: <strong>{TAX_RATE}</strong> ({taxPercent}% inclusive multiplier)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
