import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react'
import { useReports, ReportStatus } from '@/context/report-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { Badge } from '@/components/ui/badge'
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
  const { reports, clientes, addReport, updateReport } = useReports()

  const isView = location.pathname.includes('/visualizar')
  const isEdit = location.pathname.includes('/editar')

  const [formData, setFormData] = useState({
    numero: '',
    clienteId: '',
    dataExecucao: '',
    observacoes: '',
    status: 'Rascunho' as ReportStatus,
  })

  useEffect(() => {
    if (id && (isView || isEdit)) {
      const existing = reports.find((r) => r.id === id)
      if (existing) {
        setFormData({ ...existing })
      } else {
        toast({ title: 'Erro', description: 'Relatório não encontrado.', variant: 'destructive' })
        navigate('/')
      }
    } else if (!id && !isView && !isEdit) {
      // Auto-generate a dummy number for new reports
      setFormData((prev) => ({
        ...prev,
        numero: `00${reports.length + 1}/${new Date().getFullYear()}`,
      }))
    }
  }, [id, isView, isEdit, reports, navigate, toast])

  const comboOptions = clientes.map((c) => ({
    label: `${c.nome} (${c.cnpj})`,
    value: c.id,
  }))

  const handleSave = (newStatus: ReportStatus) => {
    if (!formData.numero || !formData.clienteId || !formData.dataExecucao) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios (Número, Cliente, Data).',
        variant: 'destructive',
      })
      return
    }

    const payload = { ...formData, status: newStatus }

    if (isEdit && id) {
      updateReport(id, payload)
      toast({ title: 'Sucesso', description: 'Relatório atualizado com sucesso.' })
    } else {
      addReport({ ...payload, id: crypto.randomUUID() })
      toast({ title: 'Sucesso', description: 'Novo relatório criado.' })
    }
    navigate('/')
  }

  const selectedClienteInfo = clientes.find((c) => c.id === formData.clienteId)

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
                  formData.status === 'Finalizado'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
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
                disabled={isView}
                placeholder="Ex: 001/2025"
                className="bg-background"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Cliente <span className="text-destructive">*</span>
              </Label>
              {isView ? (
                <Input
                  disabled
                  value={
                    selectedClienteInfo
                      ? `${selectedClienteInfo.nome} (${selectedClienteInfo.cnpj})`
                      : ''
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
                onClick={() => handleSave('Rascunho')}
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
                      onClick={() => handleSave('Finalizado')}
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
