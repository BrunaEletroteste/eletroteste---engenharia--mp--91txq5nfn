import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, FileSearch, AlertCircle } from 'lucide-react'
import { useReports } from '@/context/report-context'
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
  const { reports, clientes } = useReports()

  const [filterCliente, setFilterCliente] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Simulate network loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [filterCliente]) // Trigger loading on filter change to show cross-fade/skeleton

  const filteredReports = reports.filter((r) => !filterCliente || r.clienteId === filterCliente)

  const comboOptions = clientes.map((c) => ({
    label: `${c.nome} (${c.cnpj})`,
    value: c.id,
  }))

  const getClienteInfo = (id: string) => clientes.find((c) => c.id === id)
  const formatDate = (date: string) => {
    if (!date) return ''
    const [y, m, d] = date.split('-')
    return `${d}/${m}/${y}`
  }

  const renderStatusBadge = (status: string) => {
    if (status === 'Rascunho') {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
          Rascunho
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
        Finalizado
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl shadow-sm border">
        <div className="w-full sm:w-80">
          <Combobox
            placeholder="Filtrar por Cliente..."
            options={comboOptions}
            value={filterCliente}
            onChange={(val) => {
              setFilterCliente(val)
              setIsLoading(true)
            }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Hidden error trigger for demonstration purposes */}
          <Button
            variant="ghost"
            className="text-transparent hover:text-muted-foreground"
            onClick={() => setHasError(!hasError)}
          >
            !
          </Button>
          <Button
            onClick={() => navigate('/relatorio/novo')}
            className="w-full sm:w-auto shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {hasError ? (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Sistema</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
            <span>Ocorreu um erro ao carregar os relatórios de manutenção.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasError(false)
                setIsLoading(true)
              }}
            >
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
          <Button onClick={() => navigate('/relatorio/novo')}>Criar Primeiro Relatório</Button>
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
                  const cliente = getClienteInfo(report.clienteId)
                  return (
                    <TableRow key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium">{report.numero}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{cliente?.nome}</div>
                        <div className="text-xs text-muted-foreground">{cliente?.cnpj}</div>
                      </TableCell>
                      <TableCell>{formatDate(report.dataExecucao)}</TableCell>
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
                            disabled={report.status !== 'Rascunho'}
                            title={report.status === 'Rascunho' ? 'Editar' : 'Relatório Finalizado'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
              const cliente = getClienteInfo(report.clienteId)
              return (
                <Card key={report.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg text-primary">{report.numero}</CardTitle>
                      {renderStatusBadge(report.status)}
                    </div>
                    <CardDescription className="font-medium text-foreground mt-1">
                      {cliente?.nome}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 text-sm text-muted-foreground space-y-1">
                    <p>CNPJ: {cliente?.cnpj}</p>
                    <p>Data: {formatDate(report.dataExecucao)}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-3 border-t bg-muted/20">
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
                      disabled={report.status !== 'Rascunho'}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
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
