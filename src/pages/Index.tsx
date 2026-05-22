import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, FileSearch, AlertCircle, Copy, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Combobox } from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Index() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [reports, setReports] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [filterCliente, setFilterCliente] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      const res = await pb.collection('relatorios').getFullList({
        expand: 'cliente_id',
        sort: '-created',
      })
      setReports(res)

      if (user?.tipo_acesso === 'admin') {
        const cliRes = await pb.collection('clientes').getFullList()
        setClientes(cliRes)
      }
    } catch (e) {
      console.error(e)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('relatorios', () => {
    loadData()
  })

  const filteredReports = reports.filter((r) => !filterCliente || r.cliente_id === filterCliente)

  const comboOptions = clientes.map((c) => ({
    label: `${c.nome_empresa} (${c.cnpj})`,
    value: c.id,
  }))

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  const renderStatusBadge = (status: string) => {
    if (status === 'rascunho') {
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-800 border-amber-200 capitalize"
        >
          Rascunho
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="bg-emerald-100 text-emerald-800 border-emerald-200 capitalize"
      >
        Finalizado
      </Badge>
    )
  }

  const canCreate = user?.tipo_acesso === 'admin' || user?.tipo_acesso === 'tecnico_campo'

  const handleDuplicate = async (id: string) => {
    try {
      setIsDuplicating(id)
      const res = await pb.send(`/backend/v1/relatorios/${id}/duplicate`, {
        method: 'POST',
      })
      toast({
        title: 'Relatório duplicado',
        description: 'A cópia foi criada como rascunho.',
      })
      navigate(`/relatorio/editar/${res.id}`)
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao duplicar',
        description: e?.message || 'Não foi possível duplicar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setIsDuplicating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl shadow-sm border">
        <div className="w-full sm:w-80">
          {user?.tipo_acesso === 'admin' ? (
            <Combobox
              placeholder="Filtrar por Cliente..."
              options={comboOptions}
              value={filterCliente}
              onChange={(val) => setFilterCliente(val)}
            />
          ) : (
            <div className="text-sm font-medium text-muted-foreground p-2">Seus relatórios</div>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {canCreate && (
            <Button
              onClick={() => navigate('/relatorio/novo')}
              className="w-full sm:w-auto shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Relatório
            </Button>
          )}
        </div>
      </div>

      {hasError ? (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
            <span>Ocorreu um erro de comunicação com o servidor.</span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl bg-background shadow-sm animate-fade-in">
          <FileSearch className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum relatório encontrado</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Não existem relatórios de manutenção preventiva registrados para os filtros
            selecionados.
          </p>
          {canCreate && (
            <Button onClick={() => navigate('/relatorio/novo')}>Criar Primeiro Relatório</Button>
          )}
        </div>
      ) : (
        <div className="animate-fade-in-up">
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-xl bg-background shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px] font-semibold">Número</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="w-[160px] font-semibold">Execução</TableHead>
                  <TableHead className="w-[120px] font-semibold">Status</TableHead>
                  <TableHead className="text-right w-[140px] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const clienteInfo = report.expand?.cliente_id
                  return (
                    <TableRow key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium">{report.numero_relatorio}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {clienteInfo ? clienteInfo.nome_empresa : 'Cliente Restrito'}
                        </div>
                        {clienteInfo && (
                          <div className="text-xs text-muted-foreground">{clienteInfo.cnpj}</div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(report.data_execucao)}</TableCell>
                      <TableCell>{renderStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/relatorio/visualizar/${report.id}`)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/relatorio/editar/${report.id}`)}
                            disabled={report.status !== 'rascunho'}
                            title={report.status === 'rascunho' ? 'Editar' : 'Relatório Finalizado'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canCreate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(report.id)}
                              disabled={isDuplicating === report.id}
                              title="Duplicar"
                            >
                              {isDuplicating === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredReports.map((report) => {
              const clienteInfo = report.expand?.cliente_id
              return (
                <Card key={report.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg text-primary">
                        {report.numero_relatorio}
                      </CardTitle>
                      {renderStatusBadge(report.status)}
                    </div>
                    <CardDescription className="font-medium text-foreground mt-1">
                      {clienteInfo ? clienteInfo.nome_empresa : 'Cliente Restrito'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 text-sm text-muted-foreground space-y-1">
                    {clienteInfo && <p>CNPJ: {clienteInfo.cnpj}</p>}
                    <p>Data: {formatDate(report.data_execucao)}</p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap justify-end gap-2 pt-3 border-t bg-muted/20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/relatorio/visualizar/${report.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Visualizar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/relatorio/editar/${report.id}`)}
                      disabled={report.status !== 'rascunho'}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    {canCreate && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDuplicate(report.id)}
                        disabled={isDuplicating === report.id}
                      >
                        {isDuplicating === report.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplicar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
