import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function ReportForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()

  const isView = location.pathname.includes('/visualizar')
  const isEdit = location.pathname.includes('/editar')

  const [isLoading, setIsLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])

  const [formData, setFormData] = useState({
    numero: '',
    clienteId: '',
    dataExecucao: '',
    observacoes: '',
    status: 'rascunho',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.tipo_acesso === 'admin') {
          const cliRes = await pb.collection('clientes').getFullList()
          setClientes(cliRes)
        }

        if (id && (isView || isEdit)) {
          const res = await pb.collection('relatorios').getOne(id, { expand: 'cliente_id' })
          setFormData({
            numero: res.numero_relatorio,
            clienteId: res.cliente_id,
            dataExecucao: res.data_execucao ? res.data_execucao.split('T')[0] : '',
            observacoes: res.observacoes || '',
            status: res.status,
          })

          if (user?.tipo_acesso !== 'admin' && res.expand?.cliente_id) {
            setClientes([res.expand.cliente_id])
          }
        } else if (!id && !isView && !isEdit) {
          setFormData((prev) => ({
            ...prev,
            numero: `00${Math.floor(Math.random() * 1000)}/${new Date().getFullYear()}`,
          }))
        }
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados do relatório.',
          variant: 'destructive',
        })
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, isView, isEdit, user, navigate, toast])

  const comboOptions = clientes.map((c) => ({
    label: `${c.nome_empresa} (${c.cnpj})`,
    value: c.id,
  }))

  const handleSave = async (newStatus: string) => {
    if (!formData.numero || !formData.clienteId || !formData.dataExecucao) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios (Número, Cliente, Data).',
        variant: 'destructive',
      })
      return
    }

    try {
      const payload = {
        numero_relatorio: formData.numero,
        cliente_id: formData.clienteId,
        data_execucao: new Date(formData.dataExecucao).toISOString(),
        observacoes: formData.observacoes,
        status: newStatus,
        criado_por: user?.id,
      }

      if (isEdit && id) {
        await pb.collection('relatorios').update(id, payload)
        toast({ title: 'Sucesso', description: 'Relatório atualizado com sucesso.' })
      } else {
        await pb.collection('relatorios').create(payload)
        toast({ title: 'Sucesso', description: 'Novo relatório criado.' })
      }
      navigate('/')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Falha ao salvar relatório.',
        variant: 'destructive',
      })
    }
  }

  const selectedClienteInfo = clientes.find((c) => c.id === formData.clienteId)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {isView ? 'Visualizar Relatório' : isEdit ? 'Editar Relatório' : 'Novo Relatório'}
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Preencha os dados técnicos da manutenção preventiva.
              </CardDescription>
            </div>
            {isView && formData.status && (
              <Badge
                variant="outline"
                className={
                  formData.status === 'finalizado'
                    ? 'bg-emerald-100 text-emerald-800 capitalize'
                    : 'bg-amber-100 text-amber-800 capitalize'
                }
              >
                {formData.status}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="numero" className="text-sm font-medium">
                Número do Relatório <span className="text-destructive">*</span>
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                disabled={isView || isEdit}
                placeholder="Ex: 001/2026"
                className="bg-background"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Cliente <span className="text-destructive">*</span>
              </Label>
              {isView || user?.tipo_acesso !== 'admin' ? (
                <Input
                  disabled
                  value={
                    selectedClienteInfo
                      ? `${selectedClienteInfo.nome_empresa} (${selectedClienteInfo.cnpj})`
                      : 'Cliente Restrito'
                  }
                  className="bg-muted"
                />
              ) : (
                <Combobox
                  options={comboOptions}
                  value={formData.clienteId}
                  onChange={(val) => setFormData({ ...formData, clienteId: val })}
                  placeholder="Selecione um cliente"
                />
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="data" className="text-sm font-medium">
                Data de Execução <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.dataExecucao}
                onChange={(e) => setFormData({ ...formData, dataExecucao: e.target.value })}
                disabled={isView}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="obs" className="text-sm font-medium">
              Observações Técnicas
            </Label>
            <Textarea
              id="obs"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              disabled={isView}
              placeholder="Descreva as atividades realizadas, peças trocadas e pendências..."
              className="min-h-[160px] resize-y bg-background leading-relaxed"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 bg-muted/30 p-6 border-t rounded-b-xl">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {!isView && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => handleSave('rascunho')}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Rascunho
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Finalizar Relatório
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalizar Relatório?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação marcará o relatório como{' '}
                      <strong className="text-emerald-600">Finalizado</strong>. Após finalizado, o
                      relatório não poderá mais ser editado. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleSave('finalizado')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Sim, Finalizar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
