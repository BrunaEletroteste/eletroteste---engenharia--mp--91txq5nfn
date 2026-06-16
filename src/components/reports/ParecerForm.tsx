import { useState, useEffect, useId } from 'react'
import { EquipmentItem, ParecerItem } from '@/types/reports'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, XCircle, Info } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export function ParecerForm({
  equipment,
  isView,
  clienteId,
  onUpdate,
}: {
  equipment: EquipmentItem
  isView: boolean
  clienteId?: string
  onUpdate: (p: ParecerItem) => void
}) {
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyFetched, setHistoryFetched] = useState(false)
  const [historyParecer, setHistoryParecer] = useState<any>(null)
  const [errorHistory, setErrorHistory] = useState(false)

  const baseId = useId()
  const p = equipment.parecer || ({ parecer: '' } as ParecerItem)

  useEffect(() => {
    let active = true

    const fetchHistory = async () => {
      if (!clienteId || !equipment.tipo_equipamento || !equipment.dados_tecnicos?.numero) {
        if (active) setHistoryFetched(true)
        return
      }
      setLoadingHistory(true)
      setErrorHistory(false)
      try {
        let filter = `equipamento_id.relatorio_id.cliente_id = '${clienteId}' && equipamento_id.tipo_equipamento = '${equipment.tipo_equipamento}'`
        if (p.id) {
          filter += ` && id != '${p.id}'`
        }

        const res = await pb.collection('parecer_tecnico').getList(1, 50, {
          filter,
          sort: '-created',
          expand: 'equipamento_id,equipamento_id.relatorio_id',
        })

        const match = res.items.find((item) => {
          const eq = item.expand?.equipamento_id
          return (
            eq &&
            eq.dados_tecnicos?.numero === equipment.dados_tecnicos?.numero &&
            eq.dados_tecnicos?.subestacao === equipment.dados_tecnicos?.subestacao
          )
        })

        if (active && match) {
          setHistoryParecer(match)
          if (!p.id && !p.parecer_anterior) {
            onUpdate({ ...p, parecer_anterior: match.parecer as any })
          }
        }
      } catch (error) {
        console.error('Failed to fetch history', error)
        if (active) setErrorHistory(true)
      } finally {
        if (active) {
          setLoadingHistory(false)
          setHistoryFetched(true)
        }
      }
    }

    if (!historyFetched) {
      fetchHistory()
    }

    return () => {
      active = false
    }
  }, [clienteId, equipment, historyFetched, p.id, p, onUpdate])

  if (loadingHistory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (errorHistory) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          Não foi possível buscar o histórico deste equipamento.
          <button
            type="button"
            onClick={() => setHistoryFetched(false)}
            className="underline font-medium"
          >
            Tentar novamente
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  const handleChange = (field: keyof ParecerItem, value: any) => {
    if (isView) return
    onUpdate({ ...p, [field]: value })
  }

  const showJustification = p.parecer && p.parecer_anterior && p.parecer !== p.parecer_anterior

  const yearAnterior = historyParecer?.expand?.equipamento_id?.expand?.relatorio_id?.data_execucao
    ? new Date(historyParecer.expand.equipamento_id.expand.relatorio_id.data_execucao).getFullYear()
    : 'Anterior'

  return (
    <div className="space-y-6 animate-fade-in p-4 bg-background rounded-md border border-muted">
      {historyParecer &&
        (historyParecer.parecer === 'Possui Ressalvas' ||
          historyParecer.parecer === 'Não Conforme') && (
          <Alert
            className={cn(
              'border',
              historyParecer.parecer === 'Possui Ressalvas'
                ? 'bg-[#FEF3C7] border-yellow-300 text-yellow-900'
                : 'bg-[#FEE2E2] border-red-300 text-red-900',
            )}
          >
            {historyParecer.parecer === 'Possui Ressalvas' ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertTitle className="font-semibold text-base mb-1">
              Parecer anterior ({yearAnterior}): {historyParecer.parecer}. Validar se continua.
            </AlertTitle>
            {historyParecer.observacoes && (
              <AlertDescription className="mt-2 text-sm opacity-90 bg-white/50 p-3 rounded border border-current/10">
                <span className="block font-medium mb-1">Observações anteriores:</span>
                {historyParecer.observacoes}
              </AlertDescription>
            )}
          </Alert>
        )}

      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Status do Equipamento <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={p.parecer}
          onValueChange={(val) => handleChange('parecer', val)}
          disabled={isView}
          className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Conforme" id={`${baseId}-conf`} />
            <Label htmlFor={`${baseId}-conf`} className="font-medium cursor-pointer">
              Conforme
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Possui Ressalvas" id={`${baseId}-ress`} />
            <Label htmlFor={`${baseId}-ress`} className="font-medium cursor-pointer">
              Possui Ressalvas
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Não Conforme" id={`${baseId}-nconf`} />
            <Label htmlFor={`${baseId}-nconf`} className="font-medium cursor-pointer">
              Não Conforme
            </Label>
          </div>
        </RadioGroup>
        {!p.parecer && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            Nenhum parecer registrado. Selecione uma opção acima.
          </p>
        )}
      </div>

      {showJustification && (
        <div className="space-y-2 animate-fade-in-up duration-200">
          <Label className="text-base font-semibold">
            Justificativa da Mudança <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={p.justificativa_mudanca || ''}
            onChange={(e) => handleChange('justificativa_mudanca', e.target.value)}
            disabled={isView}
            placeholder={`Explique por que o parecer mudou de "${p.parecer_anterior}" para "${p.parecer}"`}
            className="min-h-[100px] resize-none"
          />
        </div>
      )}

      {p.observacoes_anteriores && (
        <div className="space-y-2 animate-fade-in-up duration-200">
          <Label className="text-base font-semibold text-muted-foreground flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            Observações Anteriores
          </Label>
          <div className="bg-muted p-3 rounded-md border border-border text-sm text-muted-foreground whitespace-pre-wrap">
            {p.observacoes_anteriores}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-base font-semibold">Observações</Label>
        <Textarea
          value={p.observacoes || ''}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          disabled={isView}
          placeholder="Adicione observações adicionais (opcional)"
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  )
}
