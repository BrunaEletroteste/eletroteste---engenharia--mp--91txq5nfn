import { useMemo } from 'react'

const parseDateSafe = (dateStr: string) => {
  if (!dateStr) return new Date()
  const [y, m, d] = dateStr.substring(0, 10).split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export function useDashboardStats(reports: any[], pareceres: any[]) {
  return useMemo(() => {
    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const next30Days = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000)

    let completedThisMonth = 0
    let drafts = 0
    const overdue: any[] = []
    const upcoming: any[] = []

    const clientCounts: Record<string, number> = {}
    const techStats: Record<string, { name: string; Finalizado: number; Rascunho: number }> = {}

    reports.forEach((r) => {
      if (r.status === 'rascunho') drafts++
      if (r.status === 'finalizado') {
        const execDate = parseDateSafe(r.data_execucao)
        if (execDate >= startOfCurrentMonth && execDate <= endOfCurrentMonth) {
          completedThisMonth++
        }
      }

      if (r.proxima_manutencao) {
        const prox = parseDateSafe(r.proxima_manutencao)
        if (prox < todayStart) overdue.push(r)
        else if (prox <= next30Days) upcoming.push(r)
      }

      const cName = r.expand?.cliente_id?.nome_empresa || 'Cliente Restrito'
      clientCounts[cName] = (clientCounts[cName] || 0) + 1

      const tName = r.expand?.criado_por?.name || 'Usuário Desconhecido'
      if (!techStats[tName]) techStats[tName] = { name: tName, Finalizado: 0, Rascunho: 0 }
      if (r.status === 'finalizado') techStats[tName].Finalizado++
      if (r.status === 'rascunho') techStats[tName].Rascunho++
    })

    const topClients = Object.entries(clientCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const techData = Object.values(techStats).sort(
      (a, b) => b.Finalizado + b.Rascunho - (a.Finalizado + a.Rascunho),
    )

    const pCounts = pareceres.reduce(
      (acc, p) => {
        acc[p.parecer] = (acc[p.parecer] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const complianceData = [
      { name: 'Conforme', value: pCounts['Conforme'] || 0, color: '#10b981' },
      { name: 'Ressalvas', value: pCounts['Possui Ressalvas'] || 0, color: '#f59e0b' },
      { name: 'Não Conforme', value: pCounts['Não Conforme'] || 0, color: '#ef4444' },
    ].filter((d) => d.value > 0)

    overdue.sort(
      (a, b) =>
        parseDateSafe(a.proxima_manutencao).getTime() -
        parseDateSafe(b.proxima_manutencao).getTime(),
    )
    upcoming.sort(
      (a, b) =>
        parseDateSafe(a.proxima_manutencao).getTime() -
        parseDateSafe(b.proxima_manutencao).getTime(),
    )

    return { completedThisMonth, drafts, overdue, upcoming, topClients, techData, complianceData }
  }, [reports, pareceres])
}
