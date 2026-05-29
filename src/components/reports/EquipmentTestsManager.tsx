import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { EquipmentItem, TestItem } from '@/types/reports'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { TestModal } from './TestModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealtime } from '@/hooks/use-realtime'

interface Props {
  equipment: EquipmentItem
  equipmentIndex: number
  displayIndex: number
  setEquipments: React.Dispatch<React.SetStateAction<EquipmentItem[]>>
  isView: boolean
  clienteId?: string
  reportDate?: string
}

const extractPhasesData = (t: any, tipoEquipamento: string, subType?: string) => {
  if (!t) return []

  const extractNumeric = (val: any) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return Number(val) || 0
    return 0
  }

  const calcRes = (fase: any, isTP = false) => {
    if (fase === undefined || fase === null) return undefined
    if (typeof fase !== 'object') return extractNumeric(fase)
    if (fase.resultado !== undefined) return extractNumeric(fase.resultado)
    const v1 = extractNumeric(isTP ? fase.valor1 : fase.v1)
    const v2 = extractNumeric(isTP ? fase.valor2 : fase.v2)
    return v1 * v2
  }

  if (t.tipo_teste === 'Resistências dos Isolamentos') {
    if (tipoEquipamento === 'Condutor Elétrico') {
      const d = t.dados_detalhados || {}
      return [
        { name: 'Fase A', value: calcRes(d.fase_a) },
        { name: 'Fase B', value: calcRes(d.fase_b) },
        { name: 'Fase C', value: calcRes(d.fase_c) },
      ].filter((p) => p.value !== undefined)
    } else if (
      tipoEquipamento === 'Transformador de Potencial' ||
      tipoEquipamento === 'Transformador de Corrente'
    ) {
      const d = t.dados_detalhados?.fases || {}
      return [
        { name: 'Fase A', value: calcRes(d.A, true) },
        { name: 'Fase B', value: calcRes(d.B, true) },
        { name: 'Fase C', value: calcRes(d.C, true) },
      ].filter((p) => p.value !== undefined)
    } else if (tipoEquipamento === 'Disjuntor') {
      if (subType === 'Aberto') {
        const da = t.dados_detalhados?.aberto || {}
        return [
          { name: 'A-A', value: calcRes(da.aa) },
          { name: 'B-B', value: calcRes(da.bb) },
          { name: 'C-C', value: calcRes(da.cc) },
        ].filter((p) => p.value !== undefined)
      } else {
        const df = t.dados_detalhados?.fechado || {}
        return [
          { name: 'A-B', value: calcRes(df.ab) },
          { name: 'B-C', value: calcRes(df.bc) },
          { name: 'C-A', value: calcRes(df.ac) },
          { name: 'Massa', value: calcRes(df.abc_massa) },
        ].filter((p) => p.value !== undefined)
      }
    } else {
      const d = t.dados_detalhados || {}
      return [
        { name: 'A-B', value: calcRes(d.ab) },
        { name: 'B-C', value: calcRes(d.bc) },
        { name: 'C-A', value: calcRes(d.ac) },
        { name: 'Massa', value: calcRes(d.abc_massa) },
      ].filter((p) => p.value !== undefined)
    }
  }

  if (t.tipo_teste === 'Resistências dos Enrolamentos') {
    if (subType === 'ETS') {
      const ets = t.dados_detalhados?.ets || {}
      return [
        { name: 'H1 - H3', value: extractNumeric(ets.h1_h3) },
        { name: 'H2 - H1', value: extractNumeric(ets.h2_h1) },
        { name: 'H3 - H2', value: extractNumeric(ets.h3_h2) },
      ].filter((p) => p.value !== undefined)
    } else if (subType === 'ETI') {
      const eti = t.dados_detalhados?.eti || {}
      return [
        { name: 'X1 - X3', value: extractNumeric(eti.x1_x3) },
        { name: 'X2 - X1', value: extractNumeric(eti.x2_x1) },
        { name: 'X3 - X2', value: extractNumeric(eti.x3_x2) },
      ].filter((p) => p.value !== undefined)
    }
  }

  if (t.tipo_teste === 'Resistências dos Contatos') {
    const d = t.dados_detalhados || {}
    return [
      { name: 'Fase A', value: calcRes(d.fase_a) },
      { name: 'Fase B', value: calcRes(d.fase_b) },
      { name: 'Fase C', value: calcRes(d.fase_c) },
    ].filter((p) => p.value !== undefined)
  }

  if (t.tipo_teste === 'Relação de Tensões' && tipoEquipamento === 'Transformador') {
    const d = t.dados_detalhados || {}
    return [
      { name: 'H1H3/X0X1', value: extractNumeric(d.h1h3_x0x1) },
      { name: 'H2H1/X0X2', value: extractNumeric(d.h2h1_x0x2) },
      { name: 'H3H2/X0X3', value: extractNumeric(d.h3h2_x0x3) },
    ].filter((p) => p.value !== undefined)
  }

  return [{ name: 'Valor Geral', value: extractNumeric(t.valor_teste) }]
}

export function EquipmentTestsManager({
  equipment,
  equipmentIndex,
  displayIndex,
  setEquipments,
  isView,
  clienteId,
  reportDate,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<{ test: TestItem; index: number } | null>(null)
  const [historicalTests, setHistoricalTests] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('')

  const { toast } = useToast()
  const isMobile = useIsMobile()

  const eqIdObj = equipment.dados_tecnicos || {}
  const mySubestacao = eqIdObj.subestacao?.toString().trim()
  const myNumero = eqIdObj.numero?.toString().trim()
  const myCircuito = eqIdObj.circuito?.toString().trim()

  const loadHistory = useCallback(async () => {
    if (!clienteId || !equipment.tipo_equipamento) return
    setIsLoadingHistory(true)
    setHistoryError(false)
    try {
      let filterStr = `equipamento_id.relatorio_id.cliente_id='${clienteId}' && equipamento_id.tipo_equipamento='${equipment.tipo_equipamento}'`

      if (mySubestacao) {
        const safeSub = mySubestacao.replace(/'/g, "\\'")
        filterStr += ` && equipamento_id.dados_tecnicos ~ '${safeSub}'`
      }
      if (myNumero) {
        const safeNum = myNumero.replace(/'/g, "\\'")
        filterStr += ` && equipamento_id.dados_tecnicos ~ '${safeNum}'`
      }
      if (myCircuito) {
        const safeCirc = myCircuito.replace(/'/g, "\\'")
        filterStr += ` && equipamento_id.dados_tecnicos ~ '${safeCirc}'`
      }

      const res = await pb.collection('testes_equipamento').getFullList({
        filter: filterStr,
        sort: '-data_teste',
        expand: 'equipamento_id',
      })
      setHistoricalTests(res)
    } catch (err) {
      setHistoryError(true)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [clienteId, equipment.tipo_equipamento, mySubestacao, myNumero, myCircuito])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useRealtime(
    'testes_equipamento',
    () => {
      loadHistory()
    },
    !!clienteId,
  )

  const currentTests = (equipment.testes || []).filter((t) => !t._delete)
  const currentReportDate = reportDate ? new Date(reportDate) : new Date()
  const currentYear = currentReportDate.getFullYear()

  // Filter historical tests to strictly match the combination of Subestação, Número, and Circuito
  const filteredHistorical = historicalTests.filter((t) => {
    const tEq = t.expand?.equipamento_id?.dados_tecnicos || {}

    const tSubestacao = tEq.subestacao?.toString().trim()
    const tNumero = tEq.numero?.toString().trim()
    const tCircuito = tEq.circuito?.toString().trim()

    if (mySubestacao && tSubestacao && mySubestacao.toLowerCase() !== tSubestacao.toLowerCase())
      return false
    if (myNumero && tNumero && myNumero.toLowerCase() !== tNumero.toLowerCase()) return false
    if (myCircuito && tCircuito && myCircuito.toLowerCase() !== tCircuito.toLowerCase())
      return false

    return true
  })

  const testTypes = Array.from(
    new Set([
      ...currentTests.map((t) => t.tipo_teste),
      ...filteredHistorical.map((t) => t.tipo_teste),
    ]),
  )

  useEffect(() => {
    if (testTypes.length > 0) {
      if (!activeTab || !testTypes.includes(activeTab)) {
        setActiveTab(testTypes[0])
      }
    } else {
      setActiveTab('')
    }
  }, [testTypes.join(','), activeTab])

  // Pre-filter: only previous tests (strictly before the current report's year)
  const prevTestsAll = filteredHistorical.filter((t) => {
    const tYear = new Date(t.data_teste).getFullYear()
    return tYear < currentYear
  })

  const chartDataByType = testTypes.reduce(
    (acc, type) => {
      const cTests = currentTests.filter((t) => t.tipo_teste === type)
      const pTests = prevTestsAll.filter((t) => t.tipo_teste === type)

      const cTest = cTests.length > 0 ? cTests[cTests.length - 1] : null
      const pTest = pTests.length > 0 ? pTests[0] : null

      const pYear = pTest ? new Date(pTest.data_teste).getFullYear() : currentYear - 1
      const unidade = cTest?.unidade || pTest?.unidade || ''

      if (type === 'Resistências dos Isolamentos' && equipment.tipo_equipamento === 'Disjuntor') {
        acc[type] = { isDisjuntorIsolamento: true, subTypes: {} as any }
        ;['Fechado', 'Aberto'].forEach((sub) => {
          const cPhases = extractPhasesData(cTest, equipment.tipo_equipamento, sub)
          const pPhases = extractPhasesData(pTest, equipment.tipo_equipamento, sub)

          const phaseNames = Array.from(
            new Set([...cPhases.map((p) => p.name), ...pPhases.map((p) => p.name)]),
          )

          const data = phaseNames.map((name) => {
            const cVal = cPhases.find((p) => p.name === name)?.value
            const pVal = pPhases.find((p) => p.name === name)?.value
            return {
              phase: name,
              ano_atual: cVal !== undefined ? cVal : null,
              ano_anterior: pVal !== undefined ? pVal : null,
            }
          })

          acc[type].subTypes[sub] = { data, unidade, pYear }
        })
      } else if (type === 'Resistências dos Enrolamentos') {
        acc[type] = { isEnrolamentos: true, subTypes: {} as any }
        ;['ETS', 'ETI'].forEach((sub) => {
          const cPhases = extractPhasesData(cTest, equipment.tipo_equipamento, sub)
          const pPhases = extractPhasesData(pTest, equipment.tipo_equipamento, sub)

          const phaseNames = Array.from(
            new Set([...cPhases.map((p) => p.name), ...pPhases.map((p) => p.name)]),
          )

          const data = phaseNames.map((name) => {
            const cVal = cPhases.find((p) => p.name === name)?.value
            const pVal = pPhases.find((p) => p.name === name)?.value
            return {
              phase: name,
              ano_atual: cVal !== undefined ? cVal : null,
              ano_anterior: pVal !== undefined ? pVal : null,
            }
          })

          const un = sub === 'ETS' ? 'Ω' : 'mΩ'
          acc[type].subTypes[sub] = { data, unidade: un, pYear }
        })
      } else {
        const cPhases = extractPhasesData(cTest, equipment.tipo_equipamento)
        const pPhases = extractPhasesData(pTest, equipment.tipo_equipamento)

        const phaseNames = Array.from(
          new Set([...cPhases.map((p) => p.name), ...pPhases.map((p) => p.name)]),
        )

        const data = phaseNames.map((name) => {
          const cVal = cPhases.find((p) => p.name === name)?.value
          const pVal = pPhases.find((p) => p.name === name)?.value
          return {
            phase: name,
            ano_atual: cVal !== undefined ? cVal : null,
            ano_anterior: pVal !== undefined ? pVal : null,
          }
        })

        acc[type] = {
          isDisjuntorIsolamento: false,
          data,
          unidade,
          pYear,
        }
      }
      return acc
    },
    {} as Record<string, any>,
  )

  const renderChart = (data: any[], unidade: string, pYear: number, typeName: string) => {
    const hasData = data.some((d) => d.ano_atual !== null || d.ano_anterior !== null)

    if (!hasData) {
      return (
        <div className="text-center py-10 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground h-[250px] flex items-center justify-center">
          Sem dados suficientes para {typeName}.
        </div>
      )
    }

    if (isMobile) {
      return (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fase</TableHead>
                <TableHead>{pYear}</TableHead>
                <TableHead>{currentYear}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d, idx) => (
                <TableRow key={idx}>
                  <TableCell className="py-2 text-sm">{d.phase}</TableCell>
                  <TableCell className="py-2 text-sm text-muted-foreground">
                    {d.ano_anterior ?? '-'} {d.ano_anterior !== null ? unidade : ''}
                  </TableCell>
                  <TableCell className="py-2 text-sm font-medium">
                    {d.ano_atual ?? '-'} {d.ano_atual !== null ? unidade : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    return (
      <div className="h-[300px] w-full border rounded-md p-4 bg-background flex flex-col">
        <div className="text-xs text-muted-foreground mb-2 text-right font-medium">
          Unidade: {unidade || '-'}
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer
            config={{
              ano_anterior: {
                label: pYear.toString(),
                color: 'hsl(var(--muted-foreground))',
              },
              ano_atual: {
                label: currentYear.toString(),
                color: 'hsl(var(--primary))',
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="phase"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  tickFormatter={(val) => `${val} ${unidade}`}
                  width={unidade ? 60 : 40}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="ano_anterior"
                  name={pYear.toString()}
                  fill="var(--color-ano_anterior)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ano_atual"
                  name={currentYear.toString()}
                  fill="var(--color-ano_atual)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    )
  }

  const handleSaveTest = (test: TestItem) => {
    setEquipments((prev) => {
      const newEqs = [...prev]
      const eq = { ...newEqs[equipmentIndex] }
      const testes = [...(eq.testes || [])]
      if (editingTest) testes[editingTest.index] = { ...testes[editingTest.index], ...test }
      else testes.push(test)
      eq.testes = testes
      newEqs[equipmentIndex] = eq
      return newEqs
    })
    setModalOpen(false)
    setEditingTest(null)
    toast({ title: 'Teste registrado', description: 'O teste foi salvo com sucesso.' })
  }

  const handleRemove = (testToDel: TestItem) => {
    if (!confirm('Deseja realmente remover este teste?')) return
    setEquipments((prev) => {
      const newEqs = [...prev]
      const eq = { ...newEqs[equipmentIndex] }
      const testes = [...(eq.testes || [])]
      const realIndex = testes.findIndex((t) => t === testToDel)
      if (testes[realIndex].id) testes[realIndex]._delete = true
      else testes.splice(realIndex, 1)
      eq.testes = testes
      newEqs[equipmentIndex] = eq
      return newEqs
    })
  }

  const formatTestValue = (t: any, tipoEquipamento: string, subType?: string) => {
    const formatNum = (val: any) => {
      if (typeof val === 'number' && !isNaN(val)) return new Intl.NumberFormat('pt-BR').format(val)
      return val
    }

    if (t.tipo_teste === 'Resistências dos Isolamentos') {
      if (tipoEquipamento === 'Condutor Elétrico') {
        const d = t.dados_detalhados || {}

        const calcRes = (fase: any) => {
          if (fase === undefined || fase === null) return '-'
          if (typeof fase !== 'object') return formatNum(fase)
          if (fase.resultado !== undefined) return formatNum(fase.resultado)
          const v1 = Number(fase.v1)
          const v2 = Number(fase.v2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }

        const a = calcRes(d.fase_a)
        const b = calcRes(d.fase_b)
        const c = calcRes(d.fase_c)
        const rVal = calcRes(d.reserva)
        const r = rVal !== '-' ? ` | R: ${rVal}` : ''

        return `A: ${a} | B: ${b} | C: ${c}${r}`
      } else if (
        tipoEquipamento === 'Transformador de Potencial' ||
        tipoEquipamento === 'Transformador de Corrente'
      ) {
        const d = t.dados_detalhados?.fases || {}

        const calcRes = (fase: any) => {
          if (fase === undefined || fase === null) return '-'
          if (typeof fase !== 'object') return formatNum(fase)
          if (fase.resultado !== undefined) return formatNum(fase.resultado)
          const v1 = Number(fase.valor1)
          const v2 = Number(fase.valor2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }

        const a = calcRes(d.A)
        const b = calcRes(d.B)
        const c = calcRes(d.C)
        return `A: ${a} | B: ${b} | C: ${c}`
      } else if (tipoEquipamento === 'Disjuntor') {
        const df = t.dados_detalhados?.fechado || {}
        const da = t.dados_detalhados?.aberto || {}

        const formatRes = (row: any) => {
          if (!row) return '-'
          if (row.resultado !== undefined) return formatNum(row.resultado)
          const v1 = Number(row.v1)
          const v2 = Number(row.v2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }

        const f_ab = formatRes(df.ab)
        const f_bc = formatRes(df.bc)
        const f_ca = formatRes(df.ac)
        const f_massa = formatRes(df.abc_massa)

        const a_aa = formatRes(da.aa)
        const a_bb = formatRes(da.bb)
        const a_cc = formatRes(da.cc)

        if (subType === 'Fechado') {
          return `A x B: ${f_ab} | B x C: ${f_bc} | C x A: ${f_ca} | Massa: ${f_massa}`
        }
        if (subType === 'Aberto') {
          return `A x A: ${a_aa} | B x B: ${a_bb} | C x C: ${a_cc}`
        }

        return `Fechado (A x B: ${f_ab} | B x C: ${f_bc} | C x A: ${f_ca} | Massa: ${f_massa}) | Aberto (A x A: ${a_aa} | B x B: ${a_bb} | C x C: ${a_cc})`
      } else {
        const d = t.dados_detalhados || {}
        const ab = formatNum((Number(d.ab?.v1) || 0) * (Number(d.ab?.v2) || 0))
        const bc = formatNum((Number(d.bc?.v1) || 0) * (Number(d.bc?.v2) || 0))
        const ac = formatNum((Number(d.ac?.v1) || 0) * (Number(d.ac?.v2) || 0))
        const abcm = formatNum((Number(d.abc_massa?.v1) || 0) * (Number(d.abc_massa?.v2) || 0))
        return `AB: ${ab} | BC: ${bc} | CA: ${ac} | ABC-M: ${abcm}`
      }
    }
    if (t.tipo_teste === 'Resistências dos Enrolamentos') {
      const ets = t.dados_detalhados?.ets || {}
      const eti = t.dados_detalhados?.eti || {}
      const ets_corr = t.dados_detalhados?.ets_corr
      const eti_corr = t.dados_detalhados?.eti_corr
      const calc = t.dados_detalhados?.resultados_calculados
      const tRef = t.dados_detalhados?.temperatura_referencia || 75

      const formatField = (val: any, unit: string) =>
        val !== undefined && val !== null && val !== '' ? `${formatNum(val)} ${unit}` : '-'

      let f_ets = `H1-H3: ${formatField(ets.h1_h3, 'Ω')} | H2-H1: ${formatField(ets.h2_h1, 'Ω')} | H3-H2: ${formatField(ets.h3_h2, 'Ω')}`
      let f_eti = `X1-X3: ${formatField(eti.x1_x3, 'mΩ')} | X2-X1: ${formatField(eti.x2_x1, 'mΩ')} | X3-X2: ${formatField(eti.x3_x2, 'mΩ')}`

      if (calc) {
        if (calc.ets_75 !== null && calc.ets_75 !== undefined)
          f_ets += ` | Média 75ºC: ${formatField(calc.ets_75, 'Ω')}`
        else if (calc.ets_105 !== null && calc.ets_105 !== undefined)
          f_ets += ` | Média 105ºC: ${formatField(calc.ets_105, 'Ω')}`

        if (calc.eti_75 !== null && calc.eti_75 !== undefined)
          f_eti += ` | Média 75ºC: ${formatField(calc.eti_75, 'mΩ')}`
        else if (calc.eti_105 !== null && calc.eti_105 !== undefined)
          f_eti += ` | Média 105ºC: ${formatField(calc.eti_105, 'mΩ')}`
      } else if (ets_corr || eti_corr) {
        if (ets_corr) {
          f_ets += ` (Corr. ${tRef}ºC: H1-H3: ${formatField(ets_corr.h1_h3, 'Ω')} | H2-H1: ${formatField(ets_corr.h2_h1, 'Ω')} | H3-H2: ${formatField(ets_corr.h3_h2, 'Ω')})`
        }
        if (eti_corr) {
          f_eti += ` (Corr. ${tRef}ºC: X1-X3: ${formatField(eti_corr.x1_x3, 'mΩ')} | X2-X1: ${formatField(eti_corr.x2_x1, 'mΩ')} | X3-X2: ${formatField(eti_corr.x3_x2, 'mΩ')})`
        }
      }

      if (subType === 'ETS') return f_ets
      if (subType === 'ETI') return f_eti
      return `ETS (${f_ets}) | ETI (${f_eti})`
    }
    if (t.tipo_teste === 'Resistências dos Contatos') {
      const d = t.dados_detalhados || {}
      return `A: ${formatNum(d.fase_a) ?? '-'} | B: ${formatNum(d.fase_b) ?? '-'} | C: ${formatNum(d.fase_c) ?? '-'}`
    }
    if (t.tipo_teste === 'Relação de Tensões' && tipoEquipamento === 'Transformador') {
      const d = t.dados_detalhados || {}
      return `Posição: ${d.posicao || '-'} | H1H3/X0X1: ${formatNum(d.h1h3_x0x1) || '-'} | H2H1/X0X2: ${formatNum(d.h2h1_x0x2) || '-'} | H3H2/X0X3: ${formatNum(d.h3h2_x0x3) || '-'}`
    }
    return `${formatNum(t.valor_teste)}`
  }

  const renderTabContent = (type: string, subType?: string) => {
    const isEnrolamentos = type === 'Resistências dos Enrolamentos'
    const cTests = currentTests.filter((t) => t.tipo_teste === type)
    const hTests = filteredHistorical.filter((t) => t.tipo_teste === type)

    const typeData = chartDataByType[type]
    let chartData: any[] = []
    let unidade = ''
    let pYear = currentYear - 1

    if (typeData) {
      if ((typeData.isDisjuntorIsolamento || typeData.isEnrolamentos) && subType) {
        chartData = typeData.subTypes[subType]?.data || []
        unidade = typeData.subTypes[subType]?.unidade || ''
        pYear = typeData.subTypes[subType]?.pYear || currentYear - 1
      } else {
        chartData = typeData.data || []
        unidade = typeData.unidade || ''
        pYear = typeData.pYear || currentYear - 1
      }
    }

    return (
      <div className="space-y-8 pt-2 animate-fade-in">
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Testes Atuais
          </h4>
          {cTests.length === 0 ? (
            <div className="text-center py-6 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground">
              Nenhum teste atual para esta categoria.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento Utilizado</TableHead>
                    <TableHead>Valor</TableHead>
                    {!isEnrolamentos && <TableHead>Unidade</TableHead>}
                    <TableHead>Data</TableHead>
                    {!isView && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cTests.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div
                          className="font-medium text-sm truncate max-w-[200px]"
                          title={t.equipamento_utilizado}
                        >
                          {t.equipamento_utilizado || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatTestValue(t, equipment.tipo_equipamento, subType)}
                      </TableCell>
                      {!isEnrolamentos && (
                        <TableCell className="text-sm text-muted-foreground">
                          {t.unidade || '-'}
                        </TableCell>
                      )}
                      <TableCell>{format(parseISO(t.data_teste), 'dd/MM/yyyy')}</TableCell>
                      {!isView && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600"
                              onClick={() => {
                                setEditingTest({
                                  test: t,
                                  index: equipment.testes!.findIndex((x) => x === t),
                                })
                                setModalOpen(true)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleRemove(t)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4 border-t">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Histórico de Testes (Leitura)
            </h4>
            {isLoadingHistory ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : historyError ? (
              <div className="text-sm text-red-600 flex items-center gap-2 p-4 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                Erro ao carregar histórico.
              </div>
            ) : hTests.length === 0 ? (
              <div className="text-center py-6 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground">
                Sem dados históricos para esta categoria.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipamento Utilizado</TableHead>
                      <TableHead>Valor</TableHead>
                      {!isEnrolamentos && <TableHead>Unidade</TableHead>}
                      <TableHead>Ano</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hTests.map((ht) => (
                      <TableRow key={ht.id}>
                        <TableCell className="py-2">
                          <div
                            className="font-medium text-sm truncate max-w-[150px]"
                            title={ht.equipamento_utilizado}
                          >
                            {ht.equipamento_utilizado || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-sm">
                          {formatTestValue(ht, equipment.tipo_equipamento, subType)}
                        </TableCell>
                        {!isEnrolamentos && (
                          <TableCell className="py-2 text-sm text-muted-foreground">
                            {ht.unidade || '-'}
                          </TableCell>
                        )}
                        <TableCell className="py-2 text-sm">
                          {new Date(ht.data_teste).getFullYear()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Comparativo de Medições (Fases)
            </h4>
            {chartData && chartData.length > 0 ? (
              renderChart(chartData, unidade, pYear, subType ? `${type} - ${subType}` : type)
            ) : (
              <div className="text-center py-10 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground h-[250px] flex items-center justify-center">
                Sem dados para comparação.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-primary">Gerenciamento de Testes Elétricos</h3>
          <p className="text-sm text-muted-foreground">Registre e compare os testes realizados.</p>
        </div>
        {!isView && (
          <Button
            size="sm"
            onClick={() => {
              setEditingTest(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Teste
          </Button>
        )}
      </div>

      {testTypes.length === 0 ? (
        <div className="text-center py-10 bg-muted/10 border border-dashed rounded-md text-sm text-muted-foreground">
          <p>Nenhum teste registrado para este equipamento.</p>
          {!isView && <p className="mt-1">Clique em 'Adicionar Teste' para começar.</p>}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList className="w-full flex flex-wrap h-auto bg-muted p-1 rounded-md justify-start gap-1">
            {testTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="flex-1 min-w-[150px]">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>

          {testTypes.map((type) => {
            const isDisjuntorIsolamento =
              type === 'Resistências dos Isolamentos' && equipment.tipo_equipamento === 'Disjuntor'
            const isEnrolamentos = type === 'Resistências dos Enrolamentos'

            return (
              <TabsContent key={type} value={type} className="mt-0 outline-none">
                {isDisjuntorIsolamento ? (
                  <Tabs defaultValue="Fechado" className="w-full space-y-4">
                    <TabsList className="w-full flex h-auto bg-muted/40 p-1 rounded-md justify-start gap-1">
                      <TabsTrigger value="Fechado" className="flex-1 min-w-[120px]">
                        Contatos Fechados
                      </TabsTrigger>
                      <TabsTrigger value="Aberto" className="flex-1 min-w-[120px]">
                        Contatos Abertos
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="Fechado" className="mt-0 outline-none">
                      {renderTabContent(type, 'Fechado')}
                    </TabsContent>
                    <TabsContent value="Aberto" className="mt-0 outline-none">
                      {renderTabContent(type, 'Aberto')}
                    </TabsContent>
                  </Tabs>
                ) : isEnrolamentos ? (
                  <Tabs defaultValue="ETS" className="w-full space-y-4">
                    <TabsList className="w-full flex h-auto bg-muted/40 p-1 rounded-md justify-start gap-1">
                      <TabsTrigger value="ETS" className="flex-1 min-w-[120px]">
                        ETS (Alta Tensão)
                      </TabsTrigger>
                      <TabsTrigger value="ETI" className="flex-1 min-w-[120px]">
                        ETI (Baixa Tensão)
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="ETS" className="mt-0 outline-none">
                      {renderTabContent(type, 'ETS')}
                    </TabsContent>
                    <TabsContent value="ETI" className="mt-0 outline-none">
                      {renderTabContent(type, 'ETI')}
                    </TabsContent>
                  </Tabs>
                ) : (
                  renderTabContent(type)
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      <TestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveTest}
        initialData={editingTest?.test}
        equipmentType={equipment.tipo_equipamento}
        equipmentData={equipment.dados_tecnicos}
        allTests={equipment.testes}
      />
    </div>
  )
}
