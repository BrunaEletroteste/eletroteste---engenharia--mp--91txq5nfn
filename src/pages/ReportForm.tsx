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
        setEquipments(
          eqRes.map((e) => ({
            id: e.id,
            tipo_equipamento: e.tipo_equipamento,
            dados_tecnicos: e.dados_tecnicos || {},
          })),
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

  const onSubmit = async (data: FormValues) => {
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
          if (eq.id) {
            await pb.collection('equipamentos_relatorio').update(eq.id, eqPayload)
          } else {
            await pb.collection('equipamentos_relatorio').create(eqPayload)
          }
        }
      }

      toast({ title: 'Sucesso', description: 'Relatório salvo com sucesso.' })
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

          <CardContent className="space-y-8 pt-6 p-4 sm:p-8">
            <ReportHeaderSection isView={isView} />
            <EquipmentSection
              equipments={equipments}
              setEquipments={setEquipments}
              isView={isView}
            />
          </CardContent>

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
