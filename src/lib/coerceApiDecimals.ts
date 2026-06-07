/** API decimal fields returned as strings from MySQL/PDO. */
const DECIMAL_FIELDS = new Set([
  'amount',
  'avg_sale_value',
  'change_given',
  'cost_price',
  'cost_value',
  'discount_amt',
  'expenses',
  'line_total',
  'net_profit',
  'potential_margin',
  'rating',
  'retail_value',
  'revenue',
  'selling_price',
  'subtotal',
  'tax_amt',
  'total',
  'total_amt',
  'total_cost',
  'total_discounts',
  'total_expenses',
  'total_revenue',
  'total_spent',
  'total_tax',
  'total_value',
  'unit_cost',
  'unit_price',
  'amount_paid',
  'sales_revenue_delta',
])

export function coerceApiDecimals<T>(data: T): T {
  if (data === null || data === undefined) return data

  if (Array.isArray(data)) {
    return data.map((item) => coerceApiDecimals(item)) as T
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (
        typeof value === 'string' &&
        DECIMAL_FIELDS.has(key) &&
        value.trim() !== '' &&
        Number.isFinite(Number(value))
      ) {
        result[key] = Number(value)
      } else if (value !== null && typeof value === 'object') {
        result[key] = coerceApiDecimals(value)
      } else {
        result[key] = value
      }
    }
    return result as T
  }

  return data
}
