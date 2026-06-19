export function formatNumberPtBR(
  value: number | string | null | undefined,
  maxDecimals = 4,
  minDecimals = 0,
): string {
  if (value === null || value === undefined || value === '') return ''
  let num: number
  if (typeof value === 'string') {
    const cleanStr = value.includes(',')
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/\./g, '')
    num = parseFloat(cleanStr)
  } else {
    num = value
  }
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num)
}

export function parseNumberPtBR(value: string): number | '' {
  if (!value) return ''
  const cleanStr = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value.replace(/\./g, '')
  const num = parseFloat(cleanStr)
  return isNaN(num) ? '' : num
}
