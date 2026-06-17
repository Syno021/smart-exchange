/** 1 loyalty point = R1 spent or redeemed */
export function pointsRequiredForTotal(totalAmt: number): number {
  if (totalAmt <= 0) return 0
  return Math.ceil(totalAmt)
}

export function canPayWithLoyalty(availablePoints: number, totalAmt: number): boolean {
  return totalAmt > 0 && availablePoints >= pointsRequiredForTotal(totalAmt)
}

export function loyaltyShortfallMessage(availablePoints: number, totalAmt: number): string {
  const required = pointsRequiredForTotal(totalAmt)
  const shortfall = Math.max(0, required - availablePoints)
  return `Need ${required.toLocaleString()} points (${shortfall.toLocaleString()} more required). You have ${availablePoints.toLocaleString()}.`
}
