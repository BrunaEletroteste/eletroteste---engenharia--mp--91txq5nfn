import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Save, CheckCircle2, FileText } from 'lucide-react'
import { ReportHeaderSection } from '@/components/reports/ReportHeaderSection'
import { ReportGeneralSection } from '@/components/reports/ReportGeneralSection'
import { EquipmentSection } from '@/components/reports/EquipmentSection'
import { ReportAttachmentsSection } from '@/components/reports/ReportAttachmentsSection'
import { reportFormSchema, FormValues, EquipmentItem } from '@/types/reports'
import { getEquipmentFields } from '@/lib/equipment-templates'

export default function ReportForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()

  const isViewRoute = location.pathname.includes('/visualizar')
  const isEditRoute = location.pathname.includes('/editar')

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [equipments, setEquipments] = useState<EquipmentItem[]>([])

  // Attachments State
  const [reportRecord, setReportRecord] = useState<any>(null)
  const [existingAnexos, setExistingAnexos] = useState<string[]>([])
  const [existingFotosEstrutura, setExistingFotosEstrutura] = useState<string[]>([])
  const [fotosEstruturaFiles, setFotosEstruturaFiles] = useState<File[]>([])
  const isUploadingAttachmentRef = useRef(false)

  const isSavingRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const isReloading = useRef(false)

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const isAutoSavingRef = useRef(false)
  const createdReportIdRef = useRef<string | null>(null)
  const skipLoadRef = useRef(false)
  const previousStateRef = useRef<string>('')
  const lastSaveTimeRef = useRef(0)
  const checkAndAutoSaveRef = useRef<() => void>(() => {})

  const methods = useForm<FormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { status: 'rascunho' },
  })

  const { reset } = methods

  const canEditRecord = !reportRecord || user?.tipo_acesso !== 'cliente'
  const isFinalized = reportRecord?.status === 'finalizado'
  const isLocked = isFinalized && user?.tipo_acesso !== 'admin'
  const isReadOnly = isViewRoute || !canEditRecord || isLocked

  useEffect(() => {
    if (isEditRoute && reportRecord && !isLoading) {
      if (!canEditRecord) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para editar este relatório.',
          variant: 'destructive',
        })
      } else if (isLocked) {
        toast({
          title: 'Relatório Finalizado',
          description: 'Este relatório já foi finalizado e não pode ser alterado.',
        })
      }
    }
  }, [isEditRoute, reportRecord, canEditRecord, isLocked, isLoading, toast])

  const loadData = useCallback(
    async (isSilent = false) => {
      if (skipLoadRef.current) {
        skipLoadRef.current = false
        return
      }
      try {
        if (!isSilent) {
          setIsLoading(true)
          setHasError(false)
        }

        if (id && (isViewRoute || isEditRoute)) {
          const res = await pb.collection('relatorios').getOne(id)
          setReportRecord(res)
          setExistingAnexos(res.anexos || [])
          setExistingFotosEstrutura(res.fotos_estrutura || [])
          setFotosEstruturaFiles([])

          reset({
            numero_relatorio: res.numero_relatorio,
            numero_proposta: res.numero_proposta || '',
            cliente_id: res.cliente_id,
            data_execucao: res.data_execucao ? res.data_execucao.substring(0, 10) : '',
            data_fim: res.data_fim ? res.data_fim.substring(0, 10) : '',
            acompanhante: res.acompanhante || '',
            proxima_manutencao: res.proxima_manutencao
              ? res.proxima_manutencao.substring(0, 10)
              : '',
            status: res.status as 'rascunho' | 'finalizado',
            observacoes: res.observacoes || '',
            temperatura_ambiente: res.temperatura_ambiente,
            umidade_relativa: res.umidade_relativa,
            parecer_geral: res.parecer_geral || '',
          })

          const eqRes = await pb.collection('equipamentos_relatorio').getFullList({
            filter: `relatorio_id='${id}'`,
            sort: 'ordem,created',
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
              ordem: e.ordem,
              fotos: e.fotos || [],
              testes: testesRes
                .filter((t) => t.equipamento_id === e.id)
                .map((t) => {
                  let obs = t.observacoes || ''
                  if (!obs || obs.trim() === '') {
                    if (
                      e.tipo_equipamento === 'Seccionadora' &&
                      (t.tipo_teste === 'Resistências dos Isolamentos' ||
                        t.tipo_teste === 'Resistências dos Contatos')
                    ) {
                      obs =
                        'Os valores dos testes acima foram comparados com parâmetros estatísticos para equipamentos similares em operação.'
                    } else if (
                      e.tipo_equipamento === 'Disjuntor' &&
                      t.tipo_teste === 'Resistências dos Contatos'
                    ) {
                      obs =
                        'Nota: Os valores dos testes acima foram comparados com parâmetros estatísticos para equipamentos similares em operação.'
                    } else if (e.tipo_equipamento === 'Transformador') {
                      if (t.tipo_teste === 'Resistências dos Isolamentos') {
                        obs =
                          'Nota: Os valores dos testes acima foram comparados com parâmetros de norma de manutenção para transformadores de distribuição: ABNT-NB 108-I.'
                      } else if (t.tipo_teste === 'Relação de Tensões') {
                        obs = 'Nota: Em conformidade com a norma ABNT NBR 5356/81.'
                      } else if (t.tipo_teste === 'Resistências dos Enrolamentos') {
                        obs = 'Nota: Os enrolamentos apresentam boa condução elétrica.'
                      }
                    }
                  }

                  return {
                    id: t.id,
                    tipo_teste: t.tipo_teste,
                    equipamento_utilizado: t.equipamento_utilizado || '',
                    valor_teste: t.valor_teste,
                    unidade: t.unidade,
                    data_teste: t.data_teste.substring(0, 10),
                    dados_detalhados: t.dados_detalhados || null,
                    observacoes: obs,
                  }
                }),
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

          previousStateRef.current = JSON.stringify({
            values: {
              numero_relatorio: res.numero_relatorio,
              numero_proposta: res.numero_proposta || '',
              cliente_id: res.cliente_id,
              data_execucao: res.data_execucao ? res.data_execucao.substring(0, 10) : '',
              data_fim: res.data_fim ? res.data_fim.substring(0, 10) : '',
              acompanhante: res.acompanhante || '',
              proxima_manutencao: res.proxima_manutencao
                ? res.proxima_manutencao.substring(0, 10)
                : '',
              status: res.status,
              observacoes: res.observacoes || '',
              temperatura_ambiente: res.temperatura_ambiente,
              umidade_relativa: res.umidade_relativa,
              parecer_geral: res.parecer_geral || '',
            },
            equipments: loadedEquipments,
            existingAnexos: res.anexos || [],
            existingFotosEstrutura: res.fotos_estrutura || [],
            fotosEstruturaFiles: 0,
          })
        } else {
          setReportRecord(null)
          setExistingAnexos([])
          setExistingFotosEstrutura([])
          setFotosEstruturaFiles([])
          const initialValues = {
            numero_relatorio: `00${Math.floor(Math.random() * 1000)}/${new Date().getFullYear()}`,
            numero_proposta: '',
            status: 'rascunho' as const,
            cliente_id: '',
            data_execucao: '',
            data_fim: '',
            acompanhante: '',
            proxima_manutencao: '',
            observacoes: '',
            temperatura_ambiente: '',
            umidade_relativa: '',
            parecer_geral: '',
          }
          reset(initialValues)

          previousStateRef.current = JSON.stringify({
            values: initialValues,
            equipments: [],
            existingAnexos: [],
            existingFotosEstrutura: [],
            fotosEstruturaFiles: 0,
          })
        }
      } catch (err) {
        if (!isSilent) setHasError(true)
      } finally {
        if (!isSilent) setIsLoading(false)
      }
    },
    [id, isViewRoute, isEditRoute, reset],
  )

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [loadData, user])

  const handleRemoteUpdate = useCallback(() => {
    if (
      isReloading.current ||
      isSavingRef.current ||
      isUploadingAttachmentRef.current ||
      isAutoSavingRef.current
    )
      return
    if (Date.now() - lastSaveTimeRef.current < 3000) return
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

      if (eq.tipo_equipamento === 'Condutor Elétrico') {
        const ceFields = getEquipmentFields('Condutor Elétrico').map((f) => f.name)
        const missing = ceFields.filter(
          (f) => eq.dados_tecnicos[f] === undefined || eq.dados_tecnicos[f] === '',
        )
        if (missing.length > 0) {
          toast({
            title: 'Erro de Validação',
            description: `Todos os campos do Condutor Elétrico são obrigatórios. (Equipamento: ${eq.dados_tecnicos?.numero || eq.dados_tecnicos?.circuito || ''})`,
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

      if (eq.tipo_equipamento === 'Transformador de Potencial') {
        const tpFields = getEquipmentFields('Transformador de Potencial').map((f) => f.name)
        const missing = tpFields.filter(
          (f) => eq.dados_tecnicos[f] === undefined || eq.dados_tecnicos[f] === '',
        )
        if (missing.length > 0) {
          toast({
            title: 'Erro de Validação',
            description: `Todos os campos do Transformador de Potencial são obrigatórios. (Equipamento: ${eq.dados_tecnicos?.numero || eq.dados_tecnicos?.circuito || ''})`,
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

      if (eq.tipo_equipamento === 'Relé de Proteção') {
        const rpFields = getEquipmentFields('Relé de Proteção').map((f) => f.name)
        const missing = rpFields.filter(
          (f) => eq.dados_tecnicos[f] === undefined || eq.dados_tecnicos[f] === '',
        )
        if (missing.length > 0) {
          toast({
            title: 'Erro de Validação',
            description: `Todos os campos do Relé de Proteção são obrigatórios. (Equipamento: ${eq.dados_tecnicos?.circuito || ''})`,
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

      if (status === 'finalizado') {
        if (eq.testes) {
          for (const t of eq.testes) {
            if (t._delete) continue
            if (t.tipo_teste === 'Resistências dos Contatos') {
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
                  description: `Os valores das Fases no teste de Resistências dos Contatos são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                  variant: 'destructive',
                })
                return false
              }
            }
            if (t.tipo_teste === 'Resistências dos Isolamentos') {
              const d = t.dados_detalhados || {}
              if (eq.tipo_equipamento === 'Condutor Elétrico') {
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
                    description: `Os valores das Fases no teste de Resistências dos Isolamentos são obrigatórios para Condutor Elétrico.`,
                    variant: 'destructive',
                  })
                  return false
                }
              } else if (
                eq.tipo_equipamento === 'Transformador de Potencial' ||
                eq.tipo_equipamento === 'Transformador de Corrente'
              ) {
                const rows = ['A', 'B', 'C']
                for (const r of rows) {
                  if (
                    !d.fases ||
                    !d.fases[r] ||
                    d.fases[r].valor1 === undefined ||
                    d.fases[r].valor2 === undefined ||
                    String(d.fases[r].valor1) === '' ||
                    String(d.fases[r].valor2) === ''
                  ) {
                    toast({
                      title: 'Erro de Validação',
                      description: `Os valores no teste de Resistências dos Isolamentos são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                      variant: 'destructive',
                    })
                    return false
                  }
                }
              } else if (eq.tipo_equipamento === 'Disjuntor') {
                const rowsFechado = ['ab', 'bc', 'ac', 'abc_massa']
                const rowsAberto = ['aa', 'bb', 'cc']
                for (const r of rowsFechado) {
                  if (
                    !d.fechado ||
                    !d.fechado[r] ||
                    d.fechado[r].v1 === undefined ||
                    d.fechado[r].v2 === undefined ||
                    String(d.fechado[r].v1) === '' ||
                    String(d.fechado[r].v2) === ''
                  ) {
                    toast({
                      title: 'Erro de Validação',
                      description: `Os valores no teste de Resistências dos Isolamentos (Fechado) são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                      variant: 'destructive',
                    })
                    return false
                  }
                }
                for (const r of rowsAberto) {
                  if (
                    !d.aberto ||
                    !d.aberto[r] ||
                    d.aberto[r].v1 === undefined ||
                    d.aberto[r].v2 === undefined ||
                    String(d.aberto[r].v1) === '' ||
                    String(d.aberto[r].v2) === ''
                  ) {
                    toast({
                      title: 'Erro de Validação',
                      description: `Os valores no teste de Resistências dos Isolamentos (Aberto) são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                      variant: 'destructive',
                    })
                    return false
                  }
                }
              } else {
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
                      description: `Os valores no teste de Resistências dos Isolamentos são obrigatórios. (Equipamento: ${eq.tipo_equipamento})`,
                      variant: 'destructive',
                    })
                    return false
                  }
                }
              }
            }
          }
        }

        if (!p || !p.parecer) {
          toast({
            title: 'Erro de Validação',
            description: `O parecer é obrigatório para o equipamento: ${eq.tipo_equipamento} - ${eq.dados_tecnicos?.numero || eq.dados_tecnicos?.identificacao || ''}`,
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
            description: `Justificativa é obrigatória quando há mudança de status no equipamento: ${eq.tipo_equipamento} - ${eq.dados_tecnicos?.numero || eq.dados_tecnicos?.identificacao || ''}`,
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

  const performSave = async (data: FormValues, isSilent: boolean) => {
    if (!isSilent && !validateEquipments(data.status)) return false

    if (!isSilent) {
      isSavingRef.current = true
      setIsSaving(true)
    } else {
      isAutoSavingRef.current = true
      setAutoSaveStatus('saving')
    }

    try {
      const payload: Record<string, any> = {
        numero_relatorio: data.numero_relatorio,
        numero_proposta: data.numero_proposta || '',
        cliente_id: data.cliente_id,
        data_execucao: data.data_execucao ? `${data.data_execucao} 12:00:00Z` : '',
        data_fim: data.data_fim ? `${data.data_fim} 12:00:00Z` : '',
        status: data.status,
      }
      let currentId = id || createdReportIdRef.current
      if (!currentId) {
        payload.criado_por = user?.id || ''
      }
      if (data.acompanhante) payload.acompanhante = data.acompanhante
      if (data.proxima_manutencao)
        payload.proxima_manutencao = `${data.proxima_manutencao} 12:00:00Z`
      if (data.observacoes) payload.observacoes = data.observacoes
      if (data.temperatura_ambiente !== undefined && data.temperatura_ambiente !== '')
        payload.temperatura_ambiente = Number(data.temperatura_ambiente)
      if (data.umidade_relativa !== undefined && data.umidade_relativa !== '')
        payload.umidade_relativa = Number(data.umidade_relativa)
      if (data.parecer_geral) payload.parecer_geral = data.parecer_geral

      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value)
      })

      if (reportRecord?.fotos_estrutura) {
        const removed = reportRecord.fotos_estrutura.filter(
          (f: string) => !existingFotosEstrutura.includes(f),
        )
        removed.forEach((f: string) => {
          formData.append('-fotos_estrutura', f)
        })
      }
      fotosEstruturaFiles.forEach((f) => formData.append('fotos_estrutura', f))

      if (currentId) {
        await pb.collection('relatorios').update(currentId, formData)
      } else {
        const created = await pb.collection('relatorios').create(formData)
        currentId = created.id
        createdReportIdRef.current = currentId
        skipLoadRef.current = true
        navigate(`/relatorio/editar/${currentId}`, { replace: true })
      }

      let currentOrdem = 1
      for (const eq of equipments) {
        if (eq._delete && eq.id) {
          await pb.collection('equipamentos_relatorio').delete(eq.id)
        } else if (!eq._delete) {
          const eqPayload = {
            relatorio_id: currentId,
            tipo_equipamento: eq.tipo_equipamento,
            dados_tecnicos: eq.dados_tecnicos,
            ordem: currentOrdem,
          }
          currentOrdem++

          if (eq.id) {
            await pb.collection('equipamentos_relatorio').update(eq.id, eqPayload)
          } else {
            const createdEq = await pb.collection('equipamentos_relatorio').create(eqPayload)
            eq.id = createdEq.id
          }

          if (eq.testes) {
            for (const t of eq.testes) {
              if (t._delete && t.id) {
                await pb.collection('testes_equipamento').delete(t.id)
              } else if (!t._delete) {
                const tPayload = {
                  equipamento_id: eq.id,
                  tipo_teste: t.tipo_teste,
                  valor_teste: typeof t.valor_teste === 'number' ? t.valor_teste : 0,
                  unidade: t.unidade,
                  data_teste: t.data_teste ? `${t.data_teste} 12:00:00Z` : '',
                  dados_detalhados: t.dados_detalhados || null,
                  observacoes: t.observacoes || '',
                  equipamento_utilizado: t.equipamento_utilizado || '',
                }
                if (t.id) {
                  await pb.collection('testes_equipamento').update(t.id, tPayload)
                } else {
                  const createdT = await pb.collection('testes_equipamento').create(tPayload)
                  t.id = createdT.id
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
                equipamento_id: eq.id,
                parecer: p.parecer,
                parecer_anterior: p.parecer_anterior,
                justificativa_mudanca: p.justificativa_mudanca,
                observacoes: p.observacoes,
              }
              if (p.id) {
                await pb.collection('parecer_tecnico').update(p.id, pPayload)
              } else {
                const createdP = await pb.collection('parecer_tecnico').create(pPayload)
                p.id = createdP.id
              }
            }
          }
        }
      }

      if (!isSilent) {
        toast({
          title: 'Sucesso',
          description:
            data.status === 'rascunho'
              ? 'Rascunho salvo com sucesso.'
              : 'Relatório finalizado com sucesso.',
        })
        navigate('/')
      } else {
        setLastAutoSave(new Date())
        setAutoSaveStatus('saved')
      }
      return true
    } catch (error: any) {
      if (!isSilent) {
        const fieldErrors = extractFieldErrors(error)
        const hasFieldErrors = Object.keys(fieldErrors).length > 0

        let errMsg = getErrorMessage(error)
        if (error?.status === 403) {
          errMsg = 'Você não tem permissão para realizar esta operação.'
        } else if (error?.status === 400 && hasFieldErrors) {
          errMsg = 'Verifique os campos do formulário.'
        }

        if (hasFieldErrors) {
          Object.entries(fieldErrors).forEach(([field, msg]) => {
            methods.setError(field as any, { type: 'manual', message: msg })
            if (field === 'anexos') {
              errMsg += ` Erro em anexos: ${msg}`
            } else if (field === 'equipamento_utilizado') {
              errMsg += ` Equipamento Utilizado: ${msg}`
            } else if (field === 'valor_teste') {
              errMsg += ` Valor do Teste: ${msg}`
            } else if (field === 'tipo_teste') {
              errMsg += ` Tipo de Teste: ${msg}`
            } else if (field === 'unidade') {
              errMsg += ` Unidade: ${msg}`
            }
          })
        }

        toast({
          title: hasFieldErrors ? 'Erro de Validação' : 'Erro ao Salvar',
          description: errMsg,
          variant: 'destructive',
        })
      } else {
        setAutoSaveStatus('error')
      }
      return false
    } finally {
      lastSaveTimeRef.current = Date.now()
      if (!isSilent) {
        isSavingRef.current = false
        setIsSaving(false)
      } else {
        isAutoSavingRef.current = false
      }
    }
  }

  const checkAndAutoSave = useCallback(async () => {
    const currentValues = methods.getValues()
    if (currentValues.status !== 'rascunho') return
    if (
      isReadOnly ||
      isSavingRef.current ||
      isAutoSavingRef.current ||
      isUploadingAttachmentRef.current
    )
      return

    const currentState = JSON.stringify({
      values: currentValues,
      equipments: equipments
        .filter((e) => !e._delete)
        .map((e) => ({
          ...e,
          testes: e.testes?.filter((t) => !t._delete),
          parecer: e.parecer?._delete ? undefined : e.parecer,
        })),
      existingAnexos,
      existingFotosEstrutura,
      fotosEstruturaFiles: fotosEstruturaFiles.length,
    })

    if (currentState === previousStateRef.current) {
      return
    }

    const success = await performSave(currentValues, true)
    if (success) {
      previousStateRef.current = currentState
    }
  }, [methods, equipments, isReadOnly, existingAnexos, existingFotosEstrutura, fotosEstruturaFiles])

  useEffect(() => {
    checkAndAutoSaveRef.current = checkAndAutoSave
  }, [checkAndAutoSave])

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndAutoSaveRef.current()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleStatusSubmit = (status: 'rascunho' | 'finalizado') => {
    methods.setValue('status', status)
    methods.handleSubmit((data) => performSave(data, false))()
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {isViewRoute
                    ? 'Visualizar Relatório'
                    : isEditRoute
                      ? 'Editar Relatório'
                      : 'Novo Relatório'}
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Preencha os dados técnicos da manutenção preventiva e adicione os equipamentos
                  inspecionados.
                </CardDescription>
              </div>
              <div className="hidden sm:block">
                <img
                  src="https://img.usecurling.com/i?q=electricity&color=blue&shape=fill"
                  alt="Eletro Teste"
                  className="h-12 w-auto"
                />
              </div>
            </div>
          </CardHeader>

          <div className="space-y-8 pt-6 p-4 sm:p-8 mt-0">
            <ReportHeaderSection isView={isReadOnly} />
            <ReportGeneralSection
              isView={isReadOnly}
              existingFotos={existingFotosEstrutura}
              onExistingFotosChange={setExistingFotosEstrutura}
              newFotos={fotosEstruturaFiles}
              onNewFotosChange={setFotosEstruturaFiles}
              record={reportRecord}
            />
            <EquipmentSection
              equipments={equipments}
              setEquipments={setEquipments}
              isView={isReadOnly}
            />
            <ReportAttachmentsSection
              record={reportRecord}
              existingAnexos={existingAnexos}
              onAnexosChange={(newAnexos) => setExistingAnexos(newAnexos)}
              onUploadStart={() => {
                isUploadingAttachmentRef.current = true
              }}
              onUploadEnd={() => {
                setTimeout(() => {
                  isUploadingAttachmentRef.current = false
                }, 1000)
              }}
              isView={isReadOnly}
            />
          </div>

          <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 bg-muted/30 p-6 border-t rounded-b-xl">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            {!isReadOnly && methods.watch('status') === 'rascunho' && (
              <div className="flex-1 text-xs text-muted-foreground ml-4 hidden sm:flex items-center">
                {autoSaveStatus === 'saving' && (
                  <span className="animate-pulse">Salvando rascunho automaticamente...</span>
                )}
                {autoSaveStatus === 'saved' && lastAutoSave && (
                  <span>Último salvamento automático: {lastAutoSave.toLocaleTimeString()}</span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-destructive font-medium">
                    Erro ao salvar automaticamente
                  </span>
                )}
              </div>
            )}

            {isReadOnly && isFinalized && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  onClick={() => window.open(`/relatorio/imprimir/${id}`, '_blank')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
              </div>
            )}

            {!isReadOnly && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  onClick={() => handleStatusSubmit('rascunho')}
                >
                  {isSaving ? (
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar Relatório'}
                </Button>
                <Button
                  type="button"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  onClick={() => handleStatusSubmit('finalizado')}
                >
                  {isSaving ? (
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? 'Finalizando...' : 'Finalizar Relatório'}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </FormProvider>
    </div>
  )
}
