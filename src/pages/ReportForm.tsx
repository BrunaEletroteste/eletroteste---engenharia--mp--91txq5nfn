import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
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

  const isSaving = useRef(false)
  const isReloading = useRef(false)

  const methods = useForm<FormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { status: 'rascunho' },
  })

  const { reset } = methods

  const loadData = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) {
          setIsLoading(true)
          setHasError(false)
        }

        if (id && (isView || isEdit)) {
          const res = await pb.collection('relatorios').getOne(id)
          reset({
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

          const loadedEquipments = eqRes.map((e) => {
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
                  dados_detalhados: t.dados_detalhados || null,
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
          })

          setEquipments(loadedEquipments)
        } else {
          reset({
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
        if (!isSilent) setHasError(true)
      } finally {
        if (!isSilent) setIsLoading(false)
      }
    },
    [id, isView, isEdit, reset],
  )

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [loadData, user])

  const handleRemoteUpdate = useCallback(() => {
    if (isReloading.current || isSaving.current) return
    isReloading.current = true
    toast({
      title: 'Atenção',
      description: 'Este registro foi atualizado por outro usuário. Recarregando dados...',
      variant: 'destructive',
    })
    loadData(true).finally(() => {
      setTimeout(() => {
        isReloading.current = false
      }, 1500)
    })
  }, [toast, loadData])

  useRealtime(
    'relatorios',
    (e) => {
      if (e.record.id === id) handleRemoteUpdate()
    },
    !!id,
  )

  useRealtime(
    'equipamentos_relatorio',
    (e) => {
      if (e.record.relatorio_id === id) handleRemoteUpdate()
    },
    !!id,
  )

  useRealtime(
    'testes_equipamento',
    (e) => {
      if (equipments.some((eq) => eq.id === e.record.equipamento_id)) handleRemoteUpdate()
    },
    !!id && equipments.length > 0,
  )

  useRealtime(
    'parecer_tecnico',
    (e) => {
      if (equipments.some((eq) => eq.id === e.record.equipamento_id)) handleRemoteUpdate()
    },
    !!id && equipments.length > 0,
  )

  const validateEquipments = (status: 'rascunho' | 'finalizado') => {
    for (let i = 0; i < equipments.length; i++) {
      const eq = equipments[i]
      if (eq._delete) continue

      const p = eq.parecer
      if (status === 'finalizado') {
        if (eq.testes) {
          for (const t of eq.testes) {
            if (t._delete) continue
            if (t.tipo_teste === 'Resistência dos Contatos') {
              const d = t.dados_detalhados || {}
              if (
                d.fase_a === undefined ||
                d.fase_b === undefined ||
                d.fase_c === undefined ||
                String(d.fase_a) === '' ||
                String(d.fase_b) === '' ||
                String(d.fase_c) === ''
              ) {
                toast({
                  title: 'Erro de Validação',
                  description: `Os valores das Fases no teste de Resistência dos Contatos são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                  variant: 'destructive',
                })
                return false
              }
            }
            if (t.tipo_teste === 'Isolamento') {
              const d = t.dados_detalhados || {}
              const rows = ['ab', 'bc', 'ac', 'abc_massa']
              for (const r of rows) {
                if (
                  !d[r] ||
                  d[r].v1 === undefined ||
                  d[r].v2 === undefined ||
                  String(d[r].v1) === '' ||
                  String(d[r].v2) === ''
                ) {
                  toast({
                    title: 'Erro de Validação',
                    description: `Os valores no teste de Isolamento são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                    variant: 'destructive',
                  })
                  return false
                }
              }
            }
          }
        }

        if (!p || !p.parecer) {
          toast({
            title: 'Erro de Validação',
            description: `O parecer é obrigatório para o equipamento: ${eq.tipo_equipamento} - ${eq.dados_tecnicos?.numero || ''}`,
            variant: 'destructive',
          })
          const el = document.getElementById(`equipamento-${i}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-destructive', 'border-destructive')
            setTimeout(
              () => el.classList.remove('ring-2', 'ring-destructive', 'border-destructive'),
              3000,
            )
          }
          return false
        }
      }

      if (p?.parecer && p.parecer_anterior && p.parecer !== p.parecer_anterior) {
        if (
          status === 'finalizado' &&
          (!p.justificativa_mudanca || p.justificativa_mudanca.trim() === '')
        ) {
          toast({
            title: 'Erro de Validação',
            description: `Justificativa é obrigatória quando há mudança de status no equipamento: ${eq.tipo_equipamento} - ${eq.dados_tecnicos?.numero || ''}`,
            variant: 'destructive',
          })
          const el = document.getElementById(`equipamento-${i}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-destructive', 'border-destructive')
            setTimeout(
              () => el.classList.remove('ring-2', 'ring-destructive', 'border-destructive'),
              3000,
            )
          }
          return false
        }
      }
    }
    return true
  }

  const onSubmit = async (data: FormValues) => {
    if (!validateEquipments(data.status)) return
    isSaving.current = true
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
                  valor_teste: t.valor_teste || 0,
                  unidade: t.unidade,
                  data_teste: new Date(t.data_teste).toISOString(),
                  dados_detalhados: t.dados_detalhados || null,
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
            } else if (!p._delete && p.parecer) {
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

      toast({
        title: 'Sucesso',
        description:
          data.status === 'rascunho'
            ? 'Rascunho salvo com sucesso.'
            : 'Relatório finalizado com sucesso.',
      })
      navigate('/')
    } catch (error: any) {
      isSaving.current = false
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

          <div className="space-y-8 pt-6 p-4 sm:p-8 mt-0">
            <ReportHeaderSection isView={isView} />
            <EquipmentSection
              equipments={equipments}
              setEquipments={setEquipments}
              isView={isView}
            />
          </div>

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
