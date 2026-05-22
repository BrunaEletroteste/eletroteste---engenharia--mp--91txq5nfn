import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react'
import { ReportHeaderSection } from '@/components/reports/ReportHeaderSection'
import { EquipmentSection } from '@/components/reports/EquipmentSection'
import { ElectricalTestsSection } from '@/components/reports/ElectricalTestsSection'
import { ParecerTecnicoSection } from '@/components/reports/ParecerTecnicoSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { reportFormSchema, FormValues, EquipmentItem } from '@/types/reports'

export default function ReportForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()

  const isView = location.pathname.includes('/visualizar')
  const isEdit = location.pathname.includes('/editar')

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [equipments, setEquipments] = useState<EquipmentItem[]>([])

  const methods = useForm<FormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { status: 'rascunho' },
  })

  const loadData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)

      if (id && (isView || isEdit)) {
        const res = await pb.collection('relatorios').getOne(id)
        methods.reset({
          numero_relatorio: res.numero_relatorio,
          cliente_id: res.cliente_id,
          data_execucao: res.data_execucao ? res.data_execucao.split('T')[0] : '',
          acompanhante: res.acompanhante || '',
          proxima_manutencao: res.proxima_manutencao ? res.proxima_manutencao.split('T')[0] : '',
          status: res.status as 'rascunho' | 'finalizado',
          observacoes: res.observacoes || '',
        })

        const eqRes = await pb.collection('equipamentos_relatorio').getFullList({
          filter: `relatorio_id='${id}'`,
        })
        const testesRes = await pb.collection('testes_equipamento').getFullList({
          filter: `equipamento_id.relatorio_id='${id}'`,
        })
        const parecerRes = await pb.collection('parecer_tecnico').getFullList({
          filter: `equipamento_id.relatorio_id='${id}'`,
        })

        setEquipments(
          eqRes.map((e) => {
            const eqParecer = parecerRes.find((p) => p.equipamento_id === e.id)
            return {
              id: e.id,
              tipo_equipamento: e.tipo_equipamento,
              dados_tecnicos: e.dados_tecnicos || {},
              testes: testesRes
                .filter((t) => t.equipamento_id === e.id)
                .map((t) => ({
                  id: t.id,
                  tipo_teste: t.tipo_teste,
                  valor_teste: t.valor_teste,
                  unidade: t.unidade,
                  data_teste: t.data_teste.split('T')[0],
                })),
              parecer: eqParecer
                ? {
                    id: eqParecer.id,
                    parecer: eqParecer.parecer as any,
                    parecer_anterior: eqParecer.parecer_anterior as any,
                    justificativa_mudanca: eqParecer.justificativa_mudanca,
                    observacoes: eqParecer.observacoes,
                  }
                : undefined,
            }
          }),
        )
      } else {
        methods.reset({
          numero_relatorio: `00${Math.floor(Math.random() * 1000)}/${new Date().getFullYear()}`,
          status: 'rascunho',
          cliente_id: '',
          data_execucao: '',
          acompanhante: '',
          proxima_manutencao: '',
          observacoes: '',
        })
      }
    } catch (err) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, isView, isEdit, user])

  const validateEquipments = () => {
    for (const eq of equipments) {
      if (eq._delete) continue

      const p = eq.parecer
      if (!p || !p.parecer) {
        toast({
          title: 'Erro de Validação',
          description: `O parecer é obrigatório para o equipamento: ${eq.tipo_equipamento} - ${eq.dados_tecnicos?.numero || ''}`,
          variant: 'destructive',
        })
        return false
      }

      if (p.parecer_anterior && p.parecer !== p.parecer_anterior) {
        if (!p.justificativa_mudanca || p.justificativa_mudanca.trim() === '') {
          toast({
            title: 'Erro de Validação',
            description: `Justificativa é obrigatória quando há mudança de status no equipamento: ${eq.tipo_equipamento} - ${eq.dados_tecnicos?.numero || ''}`,
            variant: 'destructive',
          })
          return false
        }
      }
    }
    return true
  }

  const onSubmit = async (data: FormValues) => {
    if (!validateEquipments()) return
    try {
      setIsLoading(true)
      const payload = {
        ...data,
        data_execucao: data.data_execucao ? new Date(data.data_execucao).toISOString() : '',
        proxima_manutencao: data.proxima_manutencao
          ? new Date(data.proxima_manutencao).toISOString()
          : '',
        criado_por: user?.id,
      }

      let relatorioId = id
      if (isEdit && id) {
        await pb.collection('relatorios').update(id, payload)
      } else {
        const created = await pb.collection('relatorios').create(payload)
        relatorioId = created.id
      }

      for (const eq of equipments) {
        if (eq._delete && eq.id) {
          await pb.collection('equipamentos_relatorio').delete(eq.id)
        } else if (!eq._delete) {
          const eqPayload = {
            relatorio_id: relatorioId,
            tipo_equipamento: eq.tipo_equipamento,
            dados_tecnicos: eq.dados_tecnicos,
          }
          let savedEqId = eq.id
          if (eq.id) {
            await pb.collection('equipamentos_relatorio').update(eq.id, eqPayload)
          } else {
            const createdEq = await pb.collection('equipamentos_relatorio').create(eqPayload)
            savedEqId = createdEq.id
          }

          if (eq.testes) {
            for (const t of eq.testes) {
              if (t._delete && t.id) {
                await pb.collection('testes_equipamento').delete(t.id)
              } else if (!t._delete) {
                const tPayload = {
                  equipamento_id: savedEqId,
                  tipo_teste: t.tipo_teste,
                  valor_teste: t.valor_teste,
                  unidade: t.unidade,
                  data_teste: new Date(t.data_teste).toISOString(),
                }
                if (t.id) {
                  await pb.collection('testes_equipamento').update(t.id, tPayload)
                } else {
                  await pb.collection('testes_equipamento').create(tPayload)
                }
              }
            }
          }

          if (eq.parecer) {
            const p = eq.parecer
            if (p._delete && p.id) {
              await pb.collection('parecer_tecnico').delete(p.id)
            } else if (!p._delete) {
              const pPayload = {
                equipamento_id: savedEqId,
                parecer: p.parecer,
                parecer_anterior: p.parecer_anterior,
                justificativa_mudanca: p.justificativa_mudanca,
                observacoes: p.observacoes,
              }
              if (p.id) {
                await pb.collection('parecer_tecnico').update(p.id, pPayload)
              } else {
                await pb.collection('parecer_tecnico').create(pPayload)
              }
            }
          }
        }
      }

      toast({ title: 'Sucesso', description: 'Relatório salvo com sucesso. Parecer registrado.' })
      navigate('/')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Falha ao salvar relatório.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleStatusSubmit = (status: 'rascunho' | 'finalizado') => {
    methods.setValue('status', status)
    methods.handleSubmit(onSubmit)()
  }

  if (isLoading && !hasError) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-[150px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    )
  }

  if (hasError) {
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto">
        <AlertTitle>Erro ao carregar dados</AlertTitle>
        <AlertDescription className="flex justify-between items-center mt-2">
          <span>Ocorreu um erro ao carregar os dados do relatório.</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <FormProvider {...methods}>
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="border-b bg-muted/20 pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              {isView ? 'Visualizar Relatório' : isEdit ? 'Editar Relatório' : 'Novo Relatório'}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Preencha os dados técnicos da manutenção preventiva e adicione os equipamentos
              inspecionados.
            </CardDescription>
          </CardHeader>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-4 sm:px-8 pt-4 h-auto space-x-6 bg-transparent">
              <TabsTrigger
                value="geral"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Geral
              </TabsTrigger>
              <TabsTrigger
                value="testes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Testes Elétricos
              </TabsTrigger>
              <TabsTrigger
                value="parecer"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Parecer Técnico
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="geral"
              className="space-y-8 pt-6 p-4 sm:p-8 mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ReportHeaderSection isView={isView} />
              <EquipmentSection
                equipments={equipments}
                setEquipments={setEquipments}
                isView={isView}
              />
            </TabsContent>

            <TabsContent
              value="testes"
              className="space-y-8 pt-6 p-4 sm:p-8 mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ElectricalTestsSection
                equipments={equipments}
                setEquipments={setEquipments}
                isView={isView}
              />
            </TabsContent>

            <TabsContent
              value="parecer"
              className="space-y-8 pt-6 p-4 sm:p-8 mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ParecerTecnicoSection
                equipments={equipments}
                setEquipments={setEquipments}
                isView={isView}
              />
            </TabsContent>
          </Tabs>

          <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 bg-muted/30 p-6 border-t rounded-b-xl">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>

            {!isView && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => handleStatusSubmit('rascunho')}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Rascunho
                </Button>
                <Button
                  variant="default"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => handleStatusSubmit('finalizado')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar Relatório
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </FormProvider>
    </div>
  )
}
