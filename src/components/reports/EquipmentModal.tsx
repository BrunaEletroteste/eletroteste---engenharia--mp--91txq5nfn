import { useState, useEffect } from 'react'
import { EquipmentItem } from '@/types/reports'
import { getOpcoesPadronizadas, OpcaoPadronizada } from '@/services/opcoes'
import { getEquipmentFields, FieldDef, EQUIPMENT_TYPES } from '@/lib/equipment-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'

function ComboboxField({
  field,
  value,
  onChange,
  opcoes,
}: {
  field: FieldDef
  value: any
  onChange: (v: string) => void
  opcoes: OpcaoPadronizada[]
}) {
  const [open, setOpen] = useState(false)
  const options = opcoes.filter((o) => o.categoria.toLowerCase() === field.name.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          {value ? value : field.name === 'fabricante' ? 'Selecione o fabricante' : 'Selecione...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar...`} />
          <CommandList>
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.valor}
                  onSelect={(currentValue) => {
                    const selected = options.find(
                      (opt) => opt.valor.toLowerCase() === currentValue.toLowerCase(),
                    )
                    onChange(selected ? selected.valor : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === o.valor ? 'opacity-100' : 'opacity-0')}
                  />
                  {o.valor}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (eq: EquipmentItem) => void
  initialData?: EquipmentItem
}

export function EquipmentModal({ open, onOpenChange, onSave, initialData }: Props) {
  const { toast } = useToast()
  const [tipo, setTipo] = useState<string>('')
  const [dados, setDados] = useState<Record<string, any>>({})
  const [fields, setFields] = useState<FieldDef[]>([])
  const [opcoes, setOpcoes] = useState<OpcaoPadronizada[]>([])
  const [loadingOpcoes, setLoadingOpcoes] = useState(false)
  const [opcoesError, setOpcoesError] = useState(false)

  const fetchOpcoes = async () => {
    try {
      setLoadingOpcoes(true)
      setOpcoesError(false)
      const data = await getOpcoesPadronizadas()
      setOpcoes(data)
    } catch (error) {
      console.error(error)
      setOpcoesError(true)
      toast({
        title: 'Aviso',
        description:
          'Não foi possível carregar as opções padronizadas. Os campos de seleção funcionarão como texto livre.',
        variant: 'destructive',
      })
    } finally {
      setLoadingOpcoes(false)
    }
  }

  useEffect(() => {
    fetchOpcoes()
  }, [])

  useRealtime('opcoes_padronizadas', () => {
    fetchOpcoes()
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTipo(initialData.tipo_equipamento)
        setDados(initialData.dados_tecnicos || {})
        setFields(getEquipmentFields(initialData.tipo_equipamento))
      } else {
        setTipo('')
        setDados({})
        setFields([])
      }
    }
  }, [open, initialData])

  useEffect(() => {
    if (open) {
      const primStr = dados.tensao_primaria
      const secStr = dados.tensao_secundaria

      if (primStr !== undefined || secStr !== undefined) {
        const prim = Number(primStr)
        const sec = Number(secStr)

        if (!isNaN(prim) && !isNaN(sec) && sec !== 0) {
          setDados((prev) => {
            const relacao = Number((prim / sec).toFixed(4))
            return prev.relacao === relacao ? prev : { ...prev, relacao }
          })
        } else {
          setDados((prev) => {
            return prev.relacao === '' ? prev : { ...prev, relacao: '' }
          })
        }
      }
    }
  }, [dados.tensao_primaria, dados.tensao_secundaria, open])

  const handleTipoChange = (val: string) => {
    setTipo(val)
    setFields(getEquipmentFields(val))
    setDados({})
  }

  const handleFieldChange = (name: string, val: any) => {
    setDados((prev) => ({ ...prev, [name]: val }))
  }

  const handleSave = () => {
    if (!tipo) {
      toast({
        title: 'Atenção',
        description: 'Selecione o tipo de equipamento.',
        variant: 'destructive',
      })
      return
    }

    if (!dados.subestacao || !dados.numero) {
      toast({
        title: 'Atenção',
        description: 'Subestação e Número são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    onSave({ tipo_equipamento: tipo, dados_tecnicos: dados })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Equipamento' : 'Adicionar Equipamento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>
              Tipo de Equipamento <span className="text-destructive">*</span>
            </Label>
            <Select value={tipo} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de equipamento" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t pt-5 mt-2">
              {fields.map((field) => {
                if (field.dependsOn && dados[field.dependsOn.field] !== field.dependsOn.value) {
                  return null
                }
                return (
                  <div key={field.name} className="space-y-2">
                    <Label>
                      {field.label}
                      {['subestacao', 'numero'].includes(field.name) && (
                        <span className="text-destructive"> *</span>
                      )}
                    </Label>

                    {field.type === 'combobox' && !opcoesError ? (
                      <ComboboxField
                        field={field}
                        value={dados[field.name]?.toString() || ''}
                        onChange={(v) => handleFieldChange(field.name, v)}
                        opcoes={opcoes}
                      />
                    ) : (field.type === 'select' && field.options) ||
                      (!opcoesError &&
                        [
                          'corrente_nominal',
                          'classe_isolamento',
                          'potencia_simetrica',
                          'capacidade_ruptura',
                          'rele_minima_tensao',
                          'rele_abertura',
                          'rele_fechamento',
                          'motorizacao',
                        ].includes(field.name)) ? (
                      <Select
                        value={dados[field.name]?.toString() || ''}
                        onValueChange={(v) => handleFieldChange(field.name, v)}
                        disabled={loadingOpcoes}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={loadingOpcoes ? 'Carregando...' : 'Selecione...'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options ? (
                            field.options.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              {dados[field.name] &&
                                !opcoes.find(
                                  (op) =>
                                    op.categoria.toLowerCase() === field.name.toLowerCase() &&
                                    op.valor === dados[field.name],
                                ) && (
                                  <SelectItem value={dados[field.name]?.toString()}>
                                    {dados[field.name]}
                                  </SelectItem>
                                )}
                              {opcoes
                                .filter(
                                  (o) => o.categoria.toLowerCase() === field.name.toLowerCase(),
                                )
                                .map((o) => (
                                  <SelectItem key={o.id} value={o.valor}>
                                    {o.valor}
                                  </SelectItem>
                                ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'boolean' ? (
                      <div className="flex items-center h-10">
                        <Switch
                          checked={!!dados[field.name]}
                          onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                        />
                      </div>
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : 'text'}
                        step={field.type === 'number' ? 'any' : undefined}
                        value={dados[field.name] ?? ''}
                        onChange={(e) =>
                          handleFieldChange(
                            field.name,
                            field.type === 'number'
                              ? e.target.value === ''
                                ? ''
                                : Number(e.target.value)
                              : e.target.value,
                          )
                        }
                        placeholder={
                          field.readOnly
                            ? 'Calculado automaticamente'
                            : field.name === 'fabricante'
                              ? 'Insira o fabricante'
                              : `Insira ${field.label.toLowerCase()}`
                        }
                        readOnly={field.readOnly}
                        className={field.readOnly ? 'bg-muted cursor-not-allowed' : ''}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Equipamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
