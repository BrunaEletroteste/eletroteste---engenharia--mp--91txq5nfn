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

  if (t.tipo_teste === 'Resistências dos Contatos') {
    const d = t.dados_detalhados || {}
    return [
      { name: 'Fase A', value: calcRes(d.fase_a) },
      { name: 'Fase B', value: calcRes(d.fase_b) },
      { name: 'Fase C', value: calcRes(d.fase_c) },
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
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const loadHistory = useCallback(async () => {
    if (!clienteId || !equipment.tipo_equipamento) return
    setIsLoadingHistory(true)
    setHistoryError(false)
    try {
      const res = await pb.collection('testes_equipamento').getFullList({
        filter: `equipamento_id.relatorio_id.cliente_id='${clienteId}' && equipamento_id.tipo_equipamento='${equipment.tipo_equipamento}'`,
        sort: '-data_teste',
        expand: 'equipamento_id',
      })
      setHistoricalTests(res)
    } catch (err) {
      setHistoryError(true)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [clienteId, equipment.tipo_equipamento])

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

  // Filter historical tests to only match the same specific equipment identifier
  const eqIdObj = equipment.dados_tecnicos || {}
  const myEqId = eqIdObj.numero || eqIdObj.circuito || eqIdObj.identificacao

  const filteredHistorical = historicalTests.filter((t) => {
    const tEq = t.expand?.equipamento_id?.dados_tecnicos || {}
    const tEqId = tEq.numero || tEq.circuito || tEq.identificacao
    if (myEqId && tEqId && myEqId !== tEqId) return false
    return true
  })

  // Pre-filter: only previous tests (strictly before the current report's year)
  const prevTestsAll = filteredHistorical.filter((t) => {
    const tYear = new Date(t.data_teste).getFullYear()
    return tYear < currentYear
  })

  const testTypes = Array.from(
    new Set([...currentTests.map((t) => t.tipo_teste), ...prevTestsAll.map((t) => t.tipo_teste)]),
  )

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

  const formatTestValue = (t: any, tipoEquipamento: string) => {
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
    if (t.tipo_teste === 'Resistências dos Contatos') {
      const d = t.dados_detalhados || {}
      return `A: ${formatNum(d.fase_a) ?? '-'} | B: ${formatNum(d.fase_b) ?? '-'} | C: ${formatNum(d.fase_c) ?? '-'}`
    }
    return `${formatNum(t.valor_teste)}`
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

      <div className="space-y-8">
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Testes Atuais
          </h4>
          {currentTests.length === 0 ? (
            <div className="text-center py-6 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground">
              Nenhum teste registrado. Clique em 'Adicionar Teste' para começar.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teste / Equipamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Data</TableHead>
                    {!isView && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTests.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="font-medium text-sm">{t.tipo_teste}</div>
                        <div
                          className="text-xs text-muted-foreground truncate max-w-[200px]"
                          title={t.equipamento_utilizado}
                        >
                          {t.equipamento_utilizado}
                        </div>
                      </TableCell>
                      <TableCell>{formatTestValue(t, equipment.tipo_equipamento)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.unidade || '-'}
                      </TableCell>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t">
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
            ) : filteredHistorical.length === 0 ? (
              <div className="text-center py-6 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground">
                Sem dados históricos para este equipamento.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teste / Equipamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Ano</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorical.map((ht) => (
                      <TableRow key={ht.id}>
                        <TableCell className="py-2">
                          <div className="font-medium text-sm">{ht.tipo_teste}</div>
                          <div
                            className="text-xs text-muted-foreground truncate max-w-[150px]"
                            title={ht.equipamento_utilizado}
                          >
                            {ht.equipamento_utilizado}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-sm">
                          {formatTestValue(ht, equipment.tipo_equipamento)}
                        </TableCell>
                        <TableCell className="py-2 text-sm text-muted-foreground">
                          {ht.unidade || '-'}
                        </TableCell>
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
            {testTypes.length === 0 ? (
              <div className="text-center py-10 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground h-[250px] flex items-center justify-center">
                Sem dados para comparação.
              </div>
            ) : (
              <Tabs defaultValue={testTypes[0]} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto mb-4 bg-muted p-1 rounded-md justify-start">
                  {testTypes.map((type) => (
                    <TabsTrigger key={type} value={type} className="flex-1 min-w-[120px]">
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {testTypes.map((type) => {
                  const typeData = chartDataByType[type]

                  if (typeData.isDisjuntorIsolamento) {
                    return (
                      <TabsContent key={type} value={type} className="mt-0">
                        <Tabs defaultValue="Fechado" className="w-full">
                          <TabsList className="w-full flex h-auto mb-4 bg-muted/40 p-1 rounded-md justify-start gap-1">
                            <TabsTrigger value="Fechado" className="flex-1 min-w-[120px]">
                              Contatos Fechados
                            </TabsTrigger>
                            <TabsTrigger value="Aberto" className="flex-1 min-w-[120px]">
                              Contatos Abertos
                            </TabsTrigger>
                          </TabsList>
                          {['Fechado', 'Aberto'].map((sub) => {
                            const { data, unidade, pYear } = typeData.subTypes[sub]
                            return (
                              <TabsContent key={sub} value={sub} className="mt-0">
                                {renderChart(data, unidade, pYear, `${type} - ${sub}`)}
                              </TabsContent>
                            )
                          })}
                        </Tabs>
                      </TabsContent>
                    )
                  }

                  const { data, unidade, pYear } = typeData
                  return (
                    <TabsContent key={type} value={type} className="mt-0">
                      {renderChart(data, unidade, pYear, type)}
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </div>
        </div>
      </div>
      <TestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveTest}
        initialData={editingTest?.test}
        equipmentType={equipment.tipo_equipamento}
      />
    </div>
  )
}
