import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  FileText,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { ReportHeaderSection } from '@/components/reports/ReportHeaderSection'
import { EquipmentSection } from '@/components/reports/EquipmentSection'
import { ReportAttachmentsSection } from '@/components/reports/ReportAttachmentsSection'
import { reportFormSchema, FormValues, EquipmentItem } from '@/types/reports'
import { getEquipmentFields } from '@/lib/equipment-templates'
import { useNetwork } from '@/hooks/use-network'
import {
  getDraft,
  saveDraft,
  deleteDraft,
  getPendingFiles,
  deletePendingFile,
  generateId,
  IDBDraft,
} from '@/lib/idb'

export default function ReportForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()
  const isOnline = useNetwork()

  const isViewRoute = location.pathname.includes('/visualizar')
  const isEditRoute = location.pathname.includes('/editar')

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [equipments, setEquipments] = useState<EquipmentItem[]>([])

  const [reportRecord, setReportRecord] = useState<any>(null)
  const [existingAnexos, setExistingAnexos] = useState<string[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced')
  const [reportDirty, setReportDirty] = useState(false)
  const [reportIsNew, setReportIsNew] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState<IDBDraft | null>(null)

  const isReloading = useRef(false)
  const previousValuesRef = useRef<string>('')
  const lastSaveTimeRef = useRef(0)

  const methods = useForm<FormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { status: 'rascunho' },
  })

  const { reset } = methods

  const canEditRecord =
    !reportRecord ||
    user?.tipo_acesso === 'admin' ||
    user?.tipo_acesso === 'revisor_interno' ||
    (user?.tipo_acesso === 'tecnico_campo' && reportRecord?.status === 'rascunho')
  const isFinalized = reportRecord?.status === 'finalizado'
  const isLocked =
    isFinalized && user?.tipo_acesso !== 'admin' && user?.tipo_acesso !== 'revisor_interno'
  const isReadOnly = isViewRoute || !canEditRecord || isLocked

  useEffect(() => {
    if (!id && !isViewRoute && !isEditRoute) {
      const newId = generateId()
      navigate(`/relatorio/editar/${newId}`, { replace: true })
    }
  }, [id, isViewRoute, isEditRoute, navigate])

  const initializeEmpty = useCallback(
    (reportId: string) => {
      setReportRecord(null)
      setExistingAnexos([])
      const initialValues = {
        numero_relatorio: `00${Math.floor(Math.random() * 1000)}/${new Date().getFullYear()}`,
        numero_proposta: '',
        status: 'rascunho' as const,
        cliente_id: '',
        obra: '',
        data_execucao: '',
        data_fim: '',
        responsavel_tecnico: '',
        aprovador_relatorio: '',
        acompanhante: '',
        proxima_manutencao: '',
        observacoes: '',
      }
      reset(initialValues)
      setEquipments([])
      setReportIsNew(true)
      setReportDirty(true)
      previousValuesRef.current = JSON.stringify(initialValues)
    },
    [reset],
  )

  const applyDraft = useCallback(
    (draft: IDBDraft) => {
      reset(draft.values)
      setEquipments(draft.equipments)
      setExistingAnexos(draft.existingAnexos)
      setReportIsNew(draft.reportIsNew)
      previousValuesRef.current = JSON.stringify(draft.values)
      setReportDirty(true)
    },
    [reset],
  )

  const loadData = useCallback(
    async (isSilent = false) => {
      if (!id) return
      try {
        if (!isSilent) setIsLoading(true)

        const localDraft = await getDraft(id)

        if (isEditRoute || isViewRoute) {
          try {
            const res = await pb.collection('relatorios').getOne(id)

            setReportRecord(res)
            setExistingAnexos(res.anexos || [])

            const values = {
              numero_relatorio: res.numero_relatorio,
              numero_proposta: res.numero_proposta || '',
              cliente_id: res.cliente_id,
              obra: res.obra || '',
              data_execucao: res.data_execucao ? res.data_execucao.substring(0, 10) : '',
              data_fim: res.data_fim ? res.data_fim.substring(0, 10) : '',
              responsavel_tecnico: res.responsavel_tecnico || '',
              aprovador_relatorio: res.aprovador_relatorio || '',
              acompanhante: res.acompanhante || '',
              proxima_manutencao: res.proxima_manutencao
                ? res.proxima_manutencao.substring(0, 10)
                : '',
              status: res.status as 'rascunho' | 'finalizado',
              observacoes: res.observacoes || '',
              tipo_laudo: res.tipo_laudo || 'PREVENTIVA',
            }

            if (localDraft) {
              const serverTime = new Date(res.updated).getTime()
              // Allow 60s of clock skew tolerance
              if (localDraft.updatedAt > serverTime - 60000) {
                const hasEqChanges = localDraft.equipments?.some(
                  (eq: any) =>
                    eq._dirty ||
                    eq._delete ||
                    eq._isNew ||
                    eq.testes?.some((t: any) => t._dirty || t._delete || t._isNew) ||
                    eq.parecer?._dirty ||
                    eq.parecer?._delete ||
                    eq.parecer?._isNew,
                )

                const draftValues = localDraft.values || {}
                const valuesMatch =
                  Object.keys(values).every((key) => draftValues[key] === (values as any)[key]) &&
                  Object.keys(draftValues).every((key) => draftValues[key] === (values as any)[key])

                if (hasEqChanges || !valuesMatch) {
                  setDraftPrompt(localDraft)
                } else {
                  deleteDraft(id).catch(() => {})
                }
              } else {
                deleteDraft(id).catch(() => {})
              }
            }

            reset(values)

            const eqRes = await pb
              .collection('equipamentos_relatorio')
              .getFullList({ filter: `relatorio_id='${id}'`, sort: 'ordem,created' })
            const testesRes = await pb
              .collection('testes_equipamento')
              .getFullList({ filter: `equipamento_id.relatorio_id='${id}'` })
            const parecerRes = await pb
              .collection('parecer_tecnico')
              .getFullList({ filter: `equipamento_id.relatorio_id='${id}'` })

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
                  .map((t) => ({
                    id: t.id,
                    tipo_teste: t.tipo_teste,
                    equipamento_utilizado: t.equipamento_utilizado || '',
                    valor_teste: t.valor_teste,
                    unidade: t.unidade,
                    data_teste: t.data_teste.substring(0, 10),
                    dados_detalhados: t.dados_detalhados || null,
                    observacoes: t.observacoes || '',
                  })),
                parecer: eqParecer
                  ? {
                      id: eqParecer.id,
                      parecer: eqParecer.parecer as any,
                      parecer_anterior: eqParecer.parecer_anterior as any,
                      justificativa_mudanca: eqParecer.justificativa_mudanca,
                      observacoes: eqParecer.observacoes,
                      observacoes_anteriores: eqParecer.observacoes_anteriores,
                    }
                  : undefined,
              }
            })

            setEquipments(loadedEquipments)
            setReportIsNew(false)
            setReportDirty(false)
            previousValuesRef.current = JSON.stringify(values)
          } catch (err: any) {
            if (err.status === 404) {
              if (localDraft) {
                applyDraft(localDraft)
              } else {
                initializeEmpty(id)
              }
            } else {
              if (!isSilent) setHasError(true)
            }
          }
        }
      } catch (err) {
        if (!isSilent) setHasError(true)
      } finally {
        if (!isSilent) setIsLoading(false)
      }
    },
    [id, isViewRoute, isEditRoute, reset, applyDraft, initializeEmpty],
  )

  useEffect(() => {
    if (user && id) loadData()
  }, [loadData, user, id])

  const handleRemoteUpdate = useCallback(() => {
    if (
      reportDirty ||
      equipments.some(
        (eq) =>
          (eq as any)._dirty ||
          eq.testes?.some((t) => (t as any)._dirty) ||
          (eq.parecer as any)?._dirty,
      )
    ) {
      return
    }
    if (isReloading.current || syncStatus === 'syncing') return
    if (Date.now() - lastSaveTimeRef.current < 3000) return

    isReloading.current = true
    loadData(true).finally(() => {
      setTimeout(() => {
        isReloading.current = false
      }, 1500)
    })
  }, [reportDirty, equipments, syncStatus, loadData])

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

  const syncPendingFiles = useCallback(async () => {
    if (!isOnline) return
    const pendingFiles = await getPendingFiles()
    const myFiles = pendingFiles.filter((pf) => pf.reportId === id)
    if (myFiles.length === 0) return

    setSyncStatus('syncing')
    let anySuccess = false

    for (const pf of myFiles) {
      try {
        const fd = new FormData()
        fd.append(`${pf.field}+`, pf.file)
        await pb.collection(pf.collection).update(pf.recordId, fd)
        await deletePendingFile(pf.id)
        anySuccess = true
      } catch (e) {
        console.error('Failed to sync file', pf.name, e)
      }
    }

    if (anySuccess && !reportDirty) {
      loadData(true)
    }
    setSyncStatus('synced')
  }, [isOnline, id, reportDirty, loadData])

  const performSync = useCallback(
    async (forceReportSync = false) => {
      if (!isOnline) return
      setSyncStatus('syncing')
      try {
        let anyChanges = false

        if (reportDirty || forceReportSync) {
          const data = methods.getValues()
          const payload: Record<string, any> = {
            numero_relatorio: data.numero_relatorio,
            numero_proposta: data.numero_proposta || '',
            cliente_id: data.cliente_id,
            obra: data.obra || '',
            data_execucao: data.data_execucao ? `${data.data_execucao} 12:00:00Z` : '',
            data_fim: data.data_fim ? `${data.data_fim} 12:00:00Z` : '',
            status: data.status,
            responsavel_tecnico: data.responsavel_tecnico || '',
            aprovador_relatorio: data.aprovador_relatorio || '',
            acompanhante: data.acompanhante || '',
            proxima_manutencao: data.proxima_manutencao
              ? `${data.proxima_manutencao} 12:00:00Z`
              : '',
            observacoes: data.observacoes || '',
          }

          if (reportIsNew) {
            payload.id = id
            payload.criado_por = user?.id || ''
            const created = await pb.collection('relatorios').create(payload)
            setReportRecord(created)
            setReportIsNew(false)
          } else {
            await pb.collection('relatorios').update(id!, payload)
          }
          setReportDirty(false)
          anyChanges = true
        }

        const nextEqs = [...equipments]
        for (let i = 0; i < nextEqs.length; i++) {
          const eq = nextEqs[i] as any
          if (eq._delete && eq._dirty) {
            if (!eq._isNew && eq.id) await pb.collection('equipamentos_relatorio').delete(eq.id)
            eq._dirty = false
            anyChanges = true
            continue
          }

          if (eq._dirty) {
            const payload = {
              relatorio_id: id,
              tipo_equipamento: eq.tipo_equipamento,
              dados_tecnicos: eq.dados_tecnicos,
              ordem: eq.ordem,
            }
            if (eq._isNew) {
              try {
                const createPayload = eq.id ? { id: eq.id, ...payload } : payload
                const created = await pb.collection('equipamentos_relatorio').create(createPayload)
                eq.id = created.id
                eq._isNew = false
              } catch (e: any) {
                if (e.status === 400 && eq.id) {
                  await pb.collection('equipamentos_relatorio').update(eq.id, payload)
                  eq._isNew = false
                } else {
                  throw e
                }
              }
            } else if (eq.id) {
              await pb.collection('equipamentos_relatorio').update(eq.id, payload)
            }
            eq._dirty = false
            anyChanges = true
          }

          if (eq.testes) {
            for (let j = 0; j < eq.testes.length; j++) {
              const t = eq.testes[j] as any
              if (t._delete && t._dirty) {
                if (!t._isNew && t.id) await pb.collection('testes_equipamento').delete(t.id)
                t._dirty = false
                anyChanges = true
                continue
              }
              if (t._dirty) {
                const payload = {
                  equipamento_id: eq.id,
                  tipo_teste: t.tipo_teste,
                  valor_teste: typeof t.valor_teste === 'number' ? t.valor_teste : 0,
                  unidade: t.unidade,
                  data_teste: t.data_teste ? `${t.data_teste} 12:00:00Z` : '',
                  dados_detalhados: t.dados_detalhados || null,
                  observacoes: t.observacoes || '',
                  equipamento_utilizado: t.equipamento_utilizado || '',
                }
                if (t._isNew) {
                  try {
                    const createPayload = t.id ? { id: t.id, ...payload } : payload
                    const created = await pb.collection('testes_equipamento').create(createPayload)
                    t.id = created.id
                    t._isNew = false
                  } catch (e: any) {
                    if (e.status === 400 && t.id) {
                      await pb.collection('testes_equipamento').update(t.id, payload)
                      t._isNew = false
                    } else {
                      throw e
                    }
                  }
                } else if (t.id) {
                  await pb.collection('testes_equipamento').update(t.id, payload)
                }
                t._dirty = false
                anyChanges = true
              }
            }
          }

          if (eq.parecer) {
            const p = eq.parecer as any
            if (p._delete && p._dirty) {
              if (!p._isNew && p.id) await pb.collection('parecer_tecnico').delete(p.id)
              p._dirty = false
              anyChanges = true
            } else if (p._dirty) {
              if (!p.parecer) {
                p._dirty = false
              } else {
                const payload = {
                  equipamento_id: eq.id,
                  parecer: p.parecer,
                  parecer_anterior: p.parecer_anterior,
                  justificativa_mudanca: p.justificativa_mudanca,
                  observacoes: p.observacoes,
                  observacoes_anteriores: p.observacoes_anteriores,
                }
                if (p._isNew) {
                  try {
                    const createPayload = p.id ? { id: p.id, ...payload } : payload
                    const created = await pb.collection('parecer_tecnico').create(createPayload)
                    p.id = created.id
                    p._isNew = false
                  } catch (e: any) {
                    if (e.status === 400 && p.id) {
                      await pb.collection('parecer_tecnico').update(p.id, payload)
                      p._isNew = false
                    } else {
                      throw e
                    }
                  }
                } else if (p.id) {
                  await pb.collection('parecer_tecnico').update(p.id, payload)
                }
                p._dirty = false
                anyChanges = true
              }
            }
          }
        }

        if (anyChanges) {
          setEquipments(
            nextEqs
              .map((eq) => ({ ...eq, testes: eq.testes?.filter((t) => !(t as any)._delete) }))
              .filter((eq) => !(eq as any)._delete),
          )
        }

        setSyncStatus('synced')
        lastSaveTimeRef.current = Date.now()

        if (id) {
          await deleteDraft(id).catch(() => {})
        }

        return true
      } catch (err: any) {
        console.error('Sync error', err)
        if (err?.status === 404 && !reportIsNew) {
          setReportIsNew(true)
          setReportDirty(true)
        }
        setSyncStatus('error')
        throw err
      }
    },
    [isOnline, reportDirty, methods, reportIsNew, id, user?.id, equipments],
  )

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isReadOnly) return

      const currentValues = methods.getValues()
      let isDirty = reportDirty

      if (JSON.stringify(currentValues) !== previousValuesRef.current) {
        setReportDirty(true)
        previousValuesRef.current = JSON.stringify(currentValues)
        isDirty = true
      }

      const hasEqChanges = equipments.some(
        (eq) =>
          (eq as any)._dirty ||
          eq.testes?.some((t) => (t as any)._dirty) ||
          (eq.parecer as any)?._dirty ||
          (eq as any)._delete,
      )

      if (isDirty || hasEqChanges) {
        await saveDraft({
          id: id!,
          updatedAt: Date.now(),
          values: currentValues,
          equipments,
          existingAnexos,
          reportIsNew,
        })
        if (isOnline) {
          await performSync().catch(() => {})
          await syncPendingFiles().catch(() => {})
        } else {
          setSyncStatus('offline')
        }
      } else if (isOnline && (syncStatus === 'offline' || syncStatus === 'error')) {
        await performSync().catch(() => {})
        await syncPendingFiles().catch(() => {})
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [
    equipments,
    methods,
    isOnline,
    syncStatus,
    reportDirty,
    reportIsNew,
    id,
    existingAnexos,
    isReadOnly,
    performSync,
    syncPendingFiles,
  ])

  const validateEquipments = (status: 'rascunho' | 'finalizado') => {
    for (let i = 0; i < equipments.length; i++) {
      const eq = equipments[i] as any
      if (eq._delete) continue

      const p = eq.parecer
      if (eq.tipo_equipamento === 'Estrutura') {
        const estFields = getEquipmentFields('Estrutura').map((f) => f.name)
        const missing = estFields.filter(
          (f) => eq.dados_tecnicos[f] === undefined || eq.dados_tecnicos[f] === '',
        )
        if (missing.length > 0) {
          toast({
            title: 'Erro de Validação',
            description: `Todos os campos de Estrutura são obrigatórios.`,
            variant: 'destructive',
          })
          return false
        }
      }

      if (status === 'finalizado') {
        if (!p || !p.parecer) {
          toast({
            title: 'Erro de Validação',
            description: `O parecer é obrigatório para o equipamento: ${eq.tipo_equipamento}`,
            variant: 'destructive',
          })
          return false
        }
      }
    }
    return true
  }

  const handleStatusSubmit = async (status: 'rascunho' | 'finalizado') => {
    if (status === 'finalizado' && !validateEquipments('finalizado')) return
    methods.setValue('status', status)
    setReportDirty(true)

    await saveDraft({
      id: id!,
      updatedAt: Date.now(),
      values: methods.getValues(),
      equipments,
      existingAnexos,
      reportIsNew,
    })

    if (isOnline) {
      setIsSaving(true)
      try {
        await performSync(true)
        setIsSaving(false)
        toast({
          title: 'Sucesso',
          description: status === 'finalizado' ? 'Relatório finalizado.' : 'Rascunho salvo.',
        })
        navigate('/')
      } catch (err: any) {
        setIsSaving(false)
        toast({
          title: 'Erro ao salvar',
          description:
            err?.message ||
            'Ocorreu um erro de rede ou validação ao salvar as alterações. Verifique os dados.',
          variant: 'destructive',
        })
      }
    } else {
      setSyncStatus('offline')
      toast({
        title: 'Modo Offline',
        description: 'Alterações salvas localmente. Sincronização ocorrerá quando houver internet.',
      })
      if (status === 'finalizado') navigate('/')
    }
  }

  const discardDraft = async () => {
    if (draftPrompt) {
      await deleteDraft(draftPrompt.id)
      setDraftPrompt(null)
      loadData(true)
    }
  }

  if (!id) return null

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
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {draftPrompt && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Rascunho Local Encontrado</AlertTitle>
          <AlertDescription className="text-amber-700 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>
              Existe um rascunho salvo offline em {new Date(draftPrompt.updatedAt).toLocaleString()}{' '}
              que não foi sincronizado. Deseja restaurá-lo?
            </span>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-white hover:bg-muted"
                onClick={discardDraft}
              >
                Descartar
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  applyDraft(draftPrompt)
                  setDraftPrompt(null)
                }}
              >
                Restaurar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                {!isReadOnly && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                    {!isOnline ? (
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-800 border-amber-300 font-normal"
                      >
                        <WifiOff className="w-3 h-3 mr-1" /> Offline - Salvo Localmente
                      </Badge>
                    ) : syncStatus === 'syncing' ? (
                      <span className="flex items-center text-blue-600 font-normal text-xs bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Sincronizando...
                      </span>
                    ) : syncStatus === 'error' ? (
                      <span className="flex items-center text-red-600 font-normal text-xs bg-red-50 px-2 py-1 rounded-md border border-red-200">
                        <AlertCircle className="w-3 h-3 mr-2" /> Erro ao sincronizar
                      </span>
                    ) : (
                      <span className="flex items-center text-emerald-700 font-normal text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-2" /> Todas alterações salvas
                      </span>
                    )}
                  </div>
                )}
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
            <EquipmentSection
              equipments={equipments}
              setEquipments={setEquipments}
              isView={isReadOnly}
              reportId={id}
            />
            <ReportAttachmentsSection
              record={reportRecord}
              reportId={id}
              existingAnexos={existingAnexos}
              onAnexosChange={(newAnexos) => {
                setExistingAnexos(newAnexos)
                setReportDirty(true)
              }}
              onUploadStart={() => {}}
              onUploadEnd={() => {}}
              isView={isReadOnly}
            />
          </div>

          <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 bg-muted/30 p-6 border-t rounded-b-xl">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            {isReadOnly && isFinalized && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  onClick={() => window.open(`/relatorio/imprimir/${id}`, '_blank')}
                >
                  <FileText className="mr-2 h-4 w-4" /> Gerar PDF
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
