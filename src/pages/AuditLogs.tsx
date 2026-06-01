import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const uRes = await pb.collection('users').getFullList({ sort: 'name' })
      setUsers(uRes)

      const filters = []
      if (filterUser && filterUser !== 'all') filters.push(`user = '${filterUser}'`)
      if (startDate) filters.push(`created >= '${startDate} 00:00:00Z'`)
      if (endDate) filters.push(`created <= '${endDate} 23:59:59Z'`)

      const res = await pb.collection('audit_logs').getFullList({
        filter: filters.length > 0 ? filters.join(' && ') : '',
        sort: '-created',
        expand: 'user',
      })
      setLogs(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filterUser, startDate, endDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Login</Badge>
      case 'criacao':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Criação</Badge>
      case 'edicao':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Edição</Badge>
      case 'exclusao':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Exclusão</Badge>
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {action}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-1 block">Filtrar por Usuário</label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Data Inicial</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Data Final</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="w-[120px]">Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum log encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap font-medium text-sm">
                        {format(new Date(log.created), "dd/MM/yyyy 'às' HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {log.expand?.user?.name || 'Usuário Indefinido'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.expand?.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell className="text-sm">{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
