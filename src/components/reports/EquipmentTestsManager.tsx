import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { TestModal } from './TestModal'

interface Props {
  equipment: EquipmentItem
  equipmentIndex: number
  displayIndex: number
  setEquipments: React.Dispatch<React.SetStateAction<EquipmentItem[]>>
  isView: boolean
  clienteId?: string
  reportDate?: string
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

  useEffect(() => {
    async function loadHistory() {
      if (!clienteId || !equipment.tipo_equipamento) return
      setIsLoadingHistory(true)
      setHistoryError(false)
      try {
        const res = await pb.collection('testes_equipamento').getFullList({
          filter: `equipamento_id.relatorio_id.cliente_id='${clienteId}' && equipamento_id.tipo_equipamento='${equipment.tipo_equipamento}'`,
          sort: '-data_teste',
        })
        setHistoricalTests(res)
      } catch (err) {
        setHistoryError(true)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadHistory()
  }, [clienteId, equipment.tipo_equipamento])

  const currentTests = (equipment.testes || []).filter((t) => !t._delete)
  const currentYear = reportDate ? new Date(reportDate).getFullYear() : new Date().getFullYear()
  const previousYear = currentYear - 1

  const prevTests = historicalTests.filter(
    (t) => new Date(t.data_teste).getFullYear() === previousYear,
  )
  const testTypes = Array.from(
    new Set([...currentTests.map((t) => t.tipo_teste), ...prevTests.map((t) => t.tipo_teste)]),
  )

  const chartData = testTypes.map((type) => {
    const cTests = currentTests.filter((t) => t.tipo_teste === type)
    const pTests = prevTests.filter((t) => t.tipo_teste === type)
    return {
      tipo: type,
      ano_atual: cTests.length > 0 ? cTests[cTests.length - 1].valor_teste : null,
      ano_anterior: pTests.length > 0 ? pTests[0].valor_teste : null,
    }
  })
  const hasChartData = chartData.some((d) => d.ano_atual !== null || d.ano_anterior !== null)

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
                    <TableHead>Tipo de Teste</TableHead>
                    <TableHead>Equipamento(s)</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Data</TableHead>
                    {!isView && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTests.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{t.tipo_teste}</TableCell>
                      <TableCell
                        className="max-w-[200px] text-xs text-muted-foreground truncate"
                        title={t.equipamento_utilizado}
                      >
                        {t.equipamento_utilizado}
                      </TableCell>
                      <TableCell>
                        {t.tipo_teste === 'Resistência dos Contatos'
                          ? `A: ${t.dados_detalhados?.fase_a ?? '-'} | B: ${t.dados_detalhados?.fase_b ?? '-'} | C: ${t.dados_detalhados?.fase_c ?? '-'}`
                          : t.tipo_teste === 'Isolamento'
                            ? 'Múltiplas Medições'
                            : t.valor_teste}
                      </TableCell>
                      <TableCell>{t.unidade}</TableCell>
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
            ) : historicalTests.length === 0 ? (
              <div className="text-center py-6 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground">
                Sem dados históricos.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Equipamento(s)</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Ano</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalTests.map((ht) => (
                      <TableRow key={ht.id}>
                        <TableCell className="py-2 text-sm">{ht.tipo_teste}</TableCell>
                        <TableCell
                          className="py-2 text-xs text-muted-foreground max-w-[150px] truncate"
                          title={ht.equipamento_utilizado}
                        >
                          {ht.equipamento_utilizado}
                        </TableCell>
                        <TableCell className="py-2 text-sm">{ht.valor_teste}</TableCell>
                        <TableCell className="py-2 text-sm">{ht.unidade}</TableCell>
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
              Comparativo (Ano Atual vs Anterior)
            </h4>
            {!hasChartData ? (
              <div className="text-center py-10 bg-muted/20 border border-dashed rounded-md text-sm text-muted-foreground h-[250px] flex items-center justify-center">
                Sem dados históricos para comparação.
              </div>
            ) : isMobile ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>{previousYear}</TableHead>
                      <TableHead>{currentYear}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 text-sm">{d.tipo}</TableCell>
                        <TableCell className="py-2 text-sm text-muted-foreground">
                          {d.ano_anterior ?? '-'}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-medium">
                          {d.ano_atual ?? '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-[250px] w-full border rounded-md p-4 bg-background">
                <ChartContainer
                  config={{
                    ano_anterior: {
                      label: previousYear.toString(),
                      color: 'hsl(var(--muted-foreground))',
                    },
                    ano_atual: { label: currentYear.toString(), color: 'hsl(var(--primary))' },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="tipo"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        fontSize={12}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="ano_anterior"
                        stroke="var(--color-ano_anterior)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ano_atual"
                        stroke="var(--color-ano_atual)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </div>
        </div>
      </div>
      <TestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveTest}
        initialData={editingTest?.test}
      />
    </div>
  )
}
