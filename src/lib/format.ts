export function formatNumberPtBR(
  value: number | string | null | undefined,
  maxDecimals = 4,
  minDecimals = 0,
): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num)
}

export function parseNumberPtBR(value: string): number | '' {
  if (!value) return ''
  // If user typed using a dot for decimals and no comma, parse it directly
  if (value.includes('.') && !value.includes(',')) {
    const num = parseFloat(value)
    return isNaN(num) ? '' : num
  }
  const cleanStr = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleanStr)
  return isNaN(num) ? '' : num
}
