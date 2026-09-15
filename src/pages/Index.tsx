import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Eye,
  Pencil,
  FileSearch,
  AlertCircle,
  Copy,
  Loader2,
  MoreHorizontal,
  Trash2,
  FileText,
  Search,
  X,
  Filter,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Combobox } from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dataExecDe, setDataExecDe] = useState('')
  const [dataExecAte, setDataExecAte] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      const res = await pb.collection('relatorios').getFullList({
        expand: 'cliente_id,criado_por',
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

  const filteredReports = reports.filter((r) => {
    // Filtro por Cliente
    if (filterCliente && r.cliente_id !== filterCliente) {
      return false
    }

    // Filtro por Status
    if (filterStatus && filterStatus !== 'all' && r.status !== filterStatus) {
      return false
    }

    // Filtro por Busca Textual (numero_relatorio, numero_proposta, cliente, obra)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      const numRel = (r.numero_relatorio || '').toLowerCase()
      const numProp = (r.numero_proposta || '').toLowerCase()
      const obra = (r.obra || '').toLowerCase()
      const clienteNome = (r.expand?.cliente_id?.nome_empresa || '').toLowerCase()
      const matches =
        numRel.includes(term) ||
        numProp.includes(term) ||
        obra.includes(term) ||
        clienteNome.includes(term)
      if (!matches) {
        return false
      }
    }

    // Filtro por Data de Execução (data_execucao) - período De / Até
    if (dataExecDe || dataExecAte) {
      if (!r.data_execucao) return false
      // Pega 'YYYY-MM-DD'
      const reportDate = r.data_execucao.substring(0, 10)
      if (dataExecDe && reportDate < dataExecDe) {
        return false
      }
      if (dataExecAte && reportDate > dataExecAte) {
        return false
      }
    }

    return true
  })

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    filterCliente ||
    (filterStatus && filterStatus !== 'all') ||
    dataExecDe ||
    dataExecAte,
  )

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterCliente('')
    setFilterStatus('all')
    setDataExecDe('')
    setDataExecAte('')
  }

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

  const canCreate =
    user?.tipo_acesso === 'admin' ||
    user?.tipo_acesso === 'tecnico_campo' ||
    user?.tipo_acesso === 'revisor_interno'

  const canDelete = (report: any) => user?.tipo_acesso === 'admin'

  const canEdit = (report: any) => {
    if (user?.tipo_acesso === 'admin') return true
    if (user?.tipo_acesso === 'revisor_interno') return true
    if (user?.tipo_acesso === 'tecnico_campo' && report.status === 'rascunho') return true
    return false
  }

  const handleDelete = async () => {
    if (!reportToDelete) return
    try {
      setIsDeleting(true)
      await pb.collection('relatorios').delete(reportToDelete)
      toast({
        title: 'Relatório excluído',
        description: 'O relatório foi removido com sucesso.',
      })
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao excluir',
        description: e?.message || 'Não foi possível excluir o relatório.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setReportToDelete(null)
    }
  }

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
      {/* Barra Superior / Ação Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Relatórios Técnicos</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento e emissão de relatórios de manutenção preventiva de cabines
          </p>
        </div>
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

      {/* Painel de Filtros Avançados */}
      <div className="bg-background p-4 rounded-xl shadow-sm border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="h-4 w-4 text-primary" />
            Filtros de Pesquisa
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca por Número do Relatório / Proposta */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Buscar (Nº Relatório, Proposta, etc.)
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ex: ETME-R 6126..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Período de Execução: De / Até */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Data Execução (De)
              </label>
              <Input
                type="date"
                value={dataExecDe}
                onChange={(e) => setDataExecDe(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Data Execução (Até)
              </label>
              <Input
                type="date"
                value={dataExecAte}
                onChange={(e) => setDataExecAte(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Linha adicional para Cliente (caso Admin) */}
        {user?.tipo_acesso === 'admin' && (
          <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <Combobox
                placeholder="Filtrar por Cliente..."
                options={comboOptions}
                value={filterCliente}
                onChange={(val) => setFilterCliente(val)}
              />
            </div>
            <div className="text-xs text-muted-foreground self-end pb-2">
              Mostrando{' '}
              <span className="font-semibold text-foreground">{filteredReports.length}</span> de{' '}
              <span className="font-semibold text-foreground">{reports.length}</span> relatórios
            </div>
          </div>
        )}

        {user?.tipo_acesso !== 'admin' && (
          <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
            <span>Seus relatórios</span>
            <span>
              Mostrando{' '}
              <span className="font-semibold text-foreground">{filteredReports.length}</span> de{' '}
              <span className="font-semibold text-foreground">{reports.length}</span> relatórios
            </span>
          </div>
        )}
      </div>

      {hasError ? (
        <Alert variant="destructive">
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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl bg-background shadow-sm">
          <FileSearch className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum relatório encontrado</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {hasActiveFilters
              ? 'Nenhum relatório corresponde aos critérios de pesquisa e filtros selecionados.'
              : 'Não existem relatórios de manutenção preventiva registrados no sistema.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          ) : (
            canCreate && (
              <Button onClick={() => navigate('/relatorio/novo')}>Criar Primeiro Relatório</Button>
            )
          )}
        </div>
      ) : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-xl bg-background shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[140px] font-semibold">Número</TableHead>
                  <TableHead className="w-[140px] font-semibold">Proposta</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="w-[140px] font-semibold">Execução</TableHead>
                  <TableHead className="w-[120px] font-semibold">Status</TableHead>
                  <TableHead className="text-right w-[120px] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const clienteInfo = report.expand?.cliente_id
                  return (
                    <TableRow key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-primary">
                        {report.numero_relatorio}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {report.numero_proposta || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {clienteInfo ? clienteInfo.nome_empresa : 'Cliente Restrito'}
                        </div>
                        {clienteInfo && (
                          <div className="text-xs text-muted-foreground">{clienteInfo.cnpj}</div>
                        )}
                        {report.obra && (
                          <div className="text-xs text-muted-foreground/80 italic mt-0.5">
                            Obra: {report.obra}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(report.data_execucao)}</TableCell>
                      <TableCell>{renderStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/relatorio/visualizar/${report.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            {canEdit(report) && (
                              <DropdownMenuItem
                                onClick={() => navigate(`/relatorio/editar/${report.id}`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/relatorio/imprimir/${report.id}`, '_blank')
                              }
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Exportar PDF
                            </DropdownMenuItem>
                            {canCreate && (
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(report.id)}
                                disabled={isDuplicating === report.id}
                              >
                                {isDuplicating === report.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Copy className="mr-2 h-4 w-4" />
                                )}
                                Duplicar
                              </DropdownMenuItem>
                            )}
                            {canDelete(report) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setReportToDelete(report.id)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                    {report.numero_proposta && (
                      <p className="text-xs">
                        <span className="font-medium text-foreground">Proposta:</span>{' '}
                        {report.numero_proposta}
                      </p>
                    )}
                    {clienteInfo && <p>CNPJ: {clienteInfo.cnpj}</p>}
                    {report.obra && (
                      <p className="text-xs italic">
                        <span className="font-medium not-italic text-foreground">Obra:</span>{' '}
                        {report.obra}
                      </p>
                    )}
                    <p>Data de Execução: {formatDate(report.data_execucao)}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-3 border-t bg-muted/20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem
                          onClick={() => navigate(`/relatorio/visualizar/${report.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {canEdit(report) && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/relatorio/editar/${report.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => window.open(`/relatorio/imprimir/${report.id}`, '_blank')}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar PDF
                        </DropdownMenuItem>
                        {canCreate && (
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(report.id)}
                            disabled={isDuplicating === report.id}
                          >
                            {isDuplicating === report.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="mr-2 h-4 w-4" />
                            )}
                            Duplicar
                          </DropdownMenuItem>
                        )}
                        {canDelete(report) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setReportToDelete(report.id)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <AlertDialog
        open={!!reportToDelete}
        onOpenChange={(open) => !open && setReportToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
