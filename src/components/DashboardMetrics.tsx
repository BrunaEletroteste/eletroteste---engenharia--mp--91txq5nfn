import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, CalendarClock, CheckCircle2, FileText, Clock } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

export function DashboardMetrics({ reports, pareceres }: { reports: any[]; pareceres: any[] }) {
  const stats = useDashboardStats(reports, pareceres)
  const chartConfig = { value: { label: 'Quantidade' } }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total de Relatórios" value={reports.length} icon={FileText} />
        <MetricCard title="Concluídos (Mês)" value={stats.completedThisMonth} icon={CheckCircle2} />
        <MetricCard title="Rascunhos Pendentes" value={stats.drafts} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Produtividade da Equipe</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.techData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="Finalizado" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Rascunho" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conformidade Técnica</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.complianceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {stats.complianceData.map((e: any, i: number) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Manutenção</CardTitle>
            <CardDescription>Equipamentos com manutenção próxima ou atrasada</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-4">
                {stats.overdue.map((r: any) => (
                  <AlertItem key={r.id} report={r} type="overdue" />
                ))}
                {stats.upcoming.map((r: any) => (
                  <AlertItem key={r.id} report={r} type="upcoming" />
                ))}
                {stats.overdue.length === 0 && stats.upcoming.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum alerta no momento.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes (Relatórios)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topClients.map((c: any, i: number) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {i + 1}
                    </div>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                  <Badge variant="secondary">{c.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function AlertItem({ report, type }: { report: any; type: 'overdue' | 'upcoming' }) {
  const date = new Date(report.proxima_manutencao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  const isOverdue = type === 'overdue'
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card gap-2">
      <div>
        <p className="font-medium text-sm">{report.numero_relatorio}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
          {report.expand?.cliente_id?.nome_empresa}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="whitespace-nowrap">
          {isOverdue ? (
            <AlertTriangle className="h-3 w-3 mr-1" />
          ) : (
            <CalendarClock className="h-3 w-3 mr-1" />
          )}
          {date}
        </Badge>
      </div>
    </div>
  )
}
