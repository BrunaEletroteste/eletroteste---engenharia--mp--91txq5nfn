/**
 * Utilitários para ordenação de subestações e equipamentos
 */

export function getSubstationName(eq: any): string {
  const sub = eq?.dados_tecnicos?.subestacao
  if (typeof sub === 'string' && sub.trim()) {
    return sub.trim()
  }
  return 'Geral'
}

/**
 * Retorna o número de ordem configurado da subestação no equipamento, se houver.
 */
export function getSubstationOrder(eq: any): number | undefined {
  const ordem = eq?.dados_tecnicos?.subestacao_ordem
  if (typeof ordem === 'number' && !isNaN(ordem)) {
    return ordem
  }
  if (typeof ordem === 'string' && ordem.trim() !== '') {
    const parsed = Number(ordem)
    if (!isNaN(parsed)) return parsed
  }
  return undefined
}

/**
 * Ordena a lista de nomes de subestações:
 * 1. Pelo menor `subestacao_ordem` encontrado nos equipamentos daquela subestação (se existir)
 * 2. Em caso de empate ou se nenhuma subestação tiver ordem definida:
 *    - Ordenação alfabética padrão ('Geral' no final, conforme padrão original do sistema).
 */
export function sortSubstations(substationNames: string[], equipments: any[]): string[] {
  // Mapeia cada subestação para a menor ordem encontrada entre seus equipamentos
  const minOrderMap = new Map<string, number>()

  for (const eq of equipments) {
    if (eq?._delete) continue
    const name = getSubstationName(eq)
    const order = getSubstationOrder(eq)
    if (order !== undefined) {
      const current = minOrderMap.get(name)
      if (current === undefined || order < current) {
        minOrderMap.set(name, order)
      }
    }
  }

  const hasAnyCustomOrder = minOrderMap.size > 0

  return [...substationNames].sort((a, b) => {
    if (hasAnyCustomOrder) {
      const orderA = minOrderMap.get(a)
      const orderB = minOrderMap.get(b)

      if (orderA !== undefined && orderB !== undefined) {
        if (orderA !== orderB) return orderA - orderB
      } else if (orderA !== undefined) {
        return -1
      } else if (orderB !== undefined) {
        return 1
      }
    }

    // Fallback: ordem alfabética original com 'Geral' ao final
    if (a === 'Geral') return 1
    if (b === 'Geral') return -1
    return a.localeCompare(b, 'pt-BR')
  })
}

/**
 * Ordena a lista de equipamentos respeitando a ordem das subestações e depois
 * a ordem original do equipamento (eq.ordem ou índice).
 */
export function sortEquipmentsBySubstationOrder<T extends Record<string, any>>(
  equipments: T[],
): T[] {
  if (!equipments || equipments.length === 0) return []

  const allSubs = Array.from(new Set(equipments.map(getSubstationName)))
  const orderedSubs = sortSubstations(allSubs, equipments)
  const subIndexMap = new Map<string, number>()
  orderedSubs.forEach((sub, idx) => subIndexMap.set(sub, idx))

  return [...equipments].sort((a, b) => {
    const subA = getSubstationName(a)
    const subB = getSubstationName(b)
    const subIdxA = subIndexMap.get(subA) ?? 999
    const subIdxB = subIndexMap.get(subB) ?? 999

    if (subIdxA !== subIdxB) {
      return subIdxA - subIdxB
    }

    const orderA = typeof a.ordem === 'number' ? a.ordem : 9999
    const orderB = typeof b.ordem === 'number' ? b.ordem : 9999
    return orderA - orderB
  })
}
