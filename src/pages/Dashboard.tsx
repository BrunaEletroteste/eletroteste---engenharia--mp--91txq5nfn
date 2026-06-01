import { useState, useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DashboardMetrics } from '@/components/DashboardMetrics'

export default function Dashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [pareceres, setPareceres] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      const res = await pb.collection('relatorios').getFullList({
        expand: 'cliente_id,criado_por',
      })
      setReports(res)

      try {
        const parRes = await pb.collection('parecer_tecnico').getFullList()
        setPareceres(parRes)
      } catch (err) {
        console.error('Erro ao carregar pareceres', err)
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
  useRealtime('parecer_tecnico', () => {
    loadData()
  })

  if (hasError) {
    return (
      <div className="space-y-6">
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
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardMetrics reports={reports} pareceres={pareceres} />
    </div>
  )
}
