const STORAGE_KEY = 'smart_exchange_saved_card'

export interface SavedCardDetails {
  cardholder_name: string
  card_number: string
  expiry_month: string
  expiry_year: string
}

export function loadSavedCard(): SavedCardDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedCardDetails
    if (!parsed.cardholder_name || !parsed.card_number) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCard(details: SavedCardDetails): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(details))
}

export function clearSavedCard(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Luhn check for card number validation */
export function isValidCardNumber(number: string): boolean {
  const digits = number.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alternate = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alternate) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}
