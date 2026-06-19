import { useState, useEffect, useRef } from 'react'
import { EquipmentItem } from '@/types/reports'
import { getOpcoesPadronizadas, OpcaoPadronizada } from '@/services/opcoes'
import { getEquipmentFields, FieldDef, EQUIPMENT_TYPES } from '@/lib/equipment-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { formatNumberPtBR } from '@/lib/format'
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

function EnvFieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: any
  onChange: (val: any) => void
}) {
  const [localVal, setLocalVal] = useState(() => {
    if (value !== undefined && value !== '') {
      return formatNumberPtBR(value, 1, 1)
    }
    return ''
  })

  useEffect(() => {
    if (value === undefined || value === '') {
      setLocalVal((prev) => (prev === '' ? prev : ''))
    } else if (typeof value === 'number') {
      setLocalVal((prev) => {
        const numLocal = parseFloat(prev.replace(',', '.'))
        if (isNaN(numLocal) || numLocal !== value) {
          return formatNumberPtBR(value, 1, 1)
        }
        return prev
      })
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,-]/g, '')

    if (val.includes('-')) {
      const isNegative = val.startsWith('-')
      val = val.replace(/-/g, '')
      if (isNegative) val = '-' + val
    }

    const parts = val.split(',')
    if (parts.length > 2) {
      val = parts[0] + ',' + parts.slice(1).join('')
    }
    setLocalVal(val)

    if (val && val !== '-') {
      const num = parseFloat(val.replace(',', '.'))
      if (!isNaN(num)) {
        onChange(Math.round(num * 10) / 10)
      } else {
        onChange('')
      }
    } else {
      onChange('')
    }
  }

  const handleBlur = () => {
    if (localVal && localVal !== '-') {
      const num = parseFloat(localVal.replace(',', '.'))
      if (!isNaN(num)) {
        const rounded = Math.round(num * 10) / 10
        setLocalVal(formatNumberPtBR(rounded, 1, 1))
        onChange(rounded)
      } else {
        setLocalVal('')
        onChange('')
      }
    } else {
      setLocalVal('')
      onChange('')
    }
  }

  return (
    <Input
      type="text"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={`Insira ${field.label.toLowerCase()}`}
      readOnly={field.readOnly}
      className={field.readOnly ? 'bg-muted cursor-not-allowed' : ''}
    />
  )
}

function ComboboxField({
  field,
  value,
  onChange,
  opcoes,
  overrideCategory,
  formatAsNumber,
}: {
  field: FieldDef
  value: any
  onChange: (v: string) => void
  opcoes: OpcaoPadronizada[]
  overrideCategory?: string
  formatAsNumber?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const categoryToMatch = overrideCategory
    ? overrideCategory.toLowerCase()
    : field.name.toLowerCase()
  const options = opcoes
    .filter((o) => {
      const cat = o.categoria.toLowerCase()
      return (
        cat === categoryToMatch ||
        (categoryToMatch === 'tensão' && cat === 'tensao_primaria') ||
        (categoryToMatch === 'corrente nominal' && cat === 'corrente_nominal') ||
        (categoryToMatch === 'classe_isolamento' && cat === 'classe de isolamento')
      )
    })
    .sort((a, b) => {
      const isAlphabeticalOnly =
        categoryToMatch === 'tipo/modelo do relé de proteção' ||
        categoryToMatch === 'fabricante' ||
        categoryToMatch.includes('fabricante') ||
        categoryToMatch === 'diagrama'

      if (isAlphabeticalOnly) {
        return a.valor.localeCompare(b.valor, undefined, { numeric: true, sensitivity: 'base' })
      }

      const parseBr = (val: string) => {
        const match = val.match(/-?[\d.,]+/)
        if (!match) return null
        const cleanStr = match[0]
        if (cleanStr === '.' || cleanStr === ',') return null
        const numStr = cleanStr.replace(/\./g, '').replace(',', '.')
        const num = parseFloat(numStr)
        return isNaN(num) ? null : num
      }
      const numA = parseBr(a.valor)
      const numB = parseBr(b.valor)
      if (numA !== null && numB !== null) {
        return numA - numB
      }
      return a.valor.localeCompare(b.valor, undefined, { numeric: true, sensitivity: 'base' })
    })

  const getCleanValue = (v: string) => {
    if (!v) return v
    return v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v.replace(/\./g, '')
  }

  let displayValue = value
    ? options.find((o) => o.valor === value || getCleanValue(o.valor) === value)?.valor || value
    : ''

  if (
    formatAsNumber &&
    typeof displayValue === 'string' &&
    /^-?\d+(\.\d+)*(,\d+)?$/.test(displayValue.trim())
  ) {
    const cleanStr = displayValue.trim().replace(/\./g, '').replace(',', '.')
    const num = Number(cleanStr)
    if (!isNaN(num)) {
      displayValue = formatNumberPtBR(num, 2, 2)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          {displayValue
            ? displayValue
            : field.name === 'fabricante'
              ? 'Selecione o fabricante'
              : field.name === 'subestacao'
                ? 'Selecione a subestação'
                : field.name === 'fusivel_corrente_nominal' || field.name === 'corrente_nominal'
                  ? 'Selecione a corrente...'
                  : 'Selecione...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Buscar...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue ? (
                <div
                  className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                  onClick={() => {
                    onChange(searchValue)
                    setOpen(false)
                    setSearchValue('')
                  }}
                >
                  Usar "{searchValue}"
                </div>
              ) : (
                'Nenhuma opção encontrada.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const isSelected = value === o.valor || value === getCleanValue(o.valor)
                return (
                  <CommandItem
                    key={o.id}
                    value={o.valor}
                    onSelect={(currentValue) => {
                      const selected = options.find(
                        (opt) => opt.valor.toLowerCase() === currentValue.toLowerCase(),
                      )
                      let finalValue = selected ? selected.valor : currentValue
                      if (formatAsNumber && /^-?\d+(\.\d+)*(,\d+)?$/.test(finalValue.trim())) {
                        const cleanStr = finalValue.trim().replace(/\./g, '').replace(',', '.')
                        const num = Number(cleanStr)
                        if (!isNaN(num)) finalValue = formatNumberPtBR(num, 2, 2)
                      }
                      onChange(finalValue)
                      setOpen(false)
                      setSearchValue('')
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    {o.valor}
                  </CommandItem>
                )
              })}
              {searchValue &&
                !options.some((o) => o.valor.toLowerCase() === searchValue.toLowerCase()) && (
                  <CommandItem
                    value={searchValue}
                    onSelect={(currentValue) => {
                      let finalValue = currentValue
                      if (formatAsNumber && /^-?\d+(\.\d+)*(,\d+)?$/.test(finalValue.trim())) {
                        const cleanStr = finalValue.trim().replace(/\./g, '').replace(',', '.')
                        const num = Number(cleanStr)
                        if (!isNaN(num)) finalValue = formatNumberPtBR(num, 2, 2)
                      }
                      onChange(finalValue)
                      setOpen(false)
                      setSearchValue('')
                    }}
                  >
                    Usar "{searchValue}"
                  </CommandItem>
                )}
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

  const prevCalcDeps = useRef({
    potencia: undefined as any,
    ligado_em: undefined as any,
    tensao_secundaria: undefined as any,
  })

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
    if (open && tipo === 'Transformador' && dados.meio_isolante === 'Epóxi') {
      setDados((prev) => {
        if (prev.volume_oleo !== undefined || prev.buchas !== undefined) {
          const next = { ...prev }
          delete next.volume_oleo
          delete next.buchas
          return next
        }
        return prev
      })
    }
  }, [tipo, dados.meio_isolante, open])

  useEffect(() => {
    if (open) {
      const parseVal = (v: any) => {
        if (v === undefined || v === null || v === '') return undefined
        if (typeof v === 'number') return v
        const str = String(v)
        const clean = str.includes(',')
          ? str.replace(/\./g, '').replace(',', '.')
          : str.replace(/\./g, '')
        const num = Number(clean)
        return isNaN(num) ? undefined : num
      }

      let prim: number | undefined
      let sec: number | undefined

      if (tipo === 'Transformador de Potencial') {
        prim = parseVal(dados.tensao_primaria)
        sec = parseVal(dados.tensao_secundaria)
      } else if (tipo === 'Transformador de Corrente') {
        prim = parseVal(dados.corrente_primaria)
        sec = parseVal(dados.corrente_secundaria)
      }

      if (prim !== undefined && sec !== undefined) {
        if (sec !== 0) {
          setDados((prev) => {
            const relacao = Number((prim! / sec!).toFixed(4))
            return prev.relacao === relacao ? prev : { ...prev, relacao }
          })
        } else {
          setDados((prev) => {
            return prev.relacao === '' ? prev : { ...prev, relacao: '' }
          })
        }
      } else if (tipo === 'Transformador de Potencial' || tipo === 'Transformador de Corrente') {
        setDados((prev) => {
          return prev.relacao === '' ? prev : { ...prev, relacao: '' }
        })
      }

      if (tipo === 'Transformador') {
        const potencia = parseVal(dados.potencia)
        const ligadoEm = parseVal(dados.ligado_em)
        let tensaoSecBase: number | undefined = undefined

        if (dados.tensao_secundaria) {
          const tSecStr = String(dados.tensao_secundaria)
          const baseStr = tSecStr.split('/')[0]
          tensaoSecBase = parseVal(baseStr)
        }

        const sqrt3 = 1.732

        const pChanged = dados.potencia !== prevCalcDeps.current.potencia
        const lChanged = dados.ligado_em !== prevCalcDeps.current.ligado_em
        const tChanged = dados.tensao_secundaria !== prevCalcDeps.current.tensao_secundaria

        if (pChanged || lChanged || tChanged) {
          setDados((prev) => {
            let updated = { ...prev }
            let changed = false

            if (pChanged || lChanged) {
              if (potencia !== undefined && ligadoEm !== undefined && ligadoEm !== 0) {
                const cp = Number(((potencia * 1000) / (sqrt3 * ligadoEm)).toFixed(2))
                if (prev.corrente_primaria !== cp) {
                  updated.corrente_primaria = cp
                  changed = true
                }
              } else if (prev.corrente_primaria !== undefined && prev.corrente_primaria !== '') {
                updated.corrente_primaria = ''
                changed = true
              }
            }

            if (pChanged || tChanged) {
              if (potencia !== undefined && tensaoSecBase !== undefined && tensaoSecBase !== 0) {
                const cs = Number(((potencia * 1000) / (sqrt3 * tensaoSecBase)).toFixed(2))
                if (prev.corrente_secundaria !== cs) {
                  updated.corrente_secundaria = cs
                  changed = true
                }
              } else if (
                prev.corrente_secundaria !== undefined &&
                prev.corrente_secundaria !== ''
              ) {
                updated.corrente_secundaria = ''
                changed = true
              }
            }

            return changed ? updated : prev
          })
        }

        prevCalcDeps.current = {
          potencia: dados.potencia,
          ligado_em: dados.ligado_em,
          tensao_secundaria: dados.tensao_secundaria,
        }
      }
    }
  }, [
    dados.tensao_primaria,
    dados.tensao_secundaria,
    dados.corrente_primaria,
    dados.corrente_secundaria,
    dados.potencia,
    dados.ligado_em,
    tipo,
    open,
  ])

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

    if (tipo === 'Estrutura') {
      const requiredFieldsEstrutura = ['subestacao', 'temperatura_ambiente', 'umidade_relativa']
      const missing = requiredFieldsEstrutura.filter(
        (f) => dados[f] === undefined || dados[f] === '',
      )
      if (missing.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos da Estrutura são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    if (tipo === 'Condutor Elétrico') {
      const requiredFieldsCE = fields.map((f) => f.name)
      const missingCE = requiredFieldsCE.filter((f) => dados[f] === undefined || dados[f] === '')
      if (missingCE.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos do Condutor Elétrico são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    if (tipo === 'Relé de Proteção') {
      const requiredFieldsRP = fields.map((f) => f.name)
      const missingRP = requiredFieldsRP.filter((f) => dados[f] === undefined || dados[f] === '')
      if (missingRP.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos do Relé de Proteção são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    const hasNumeroField = fields.some((f) => f.name === 'numero')
    const requiresSubestacao = true

    if (requiresSubestacao && (!dados.subestacao || (hasNumeroField && !dados.numero))) {
      toast({
        title: 'Atenção',
        description: hasNumeroField
          ? 'Subestação e Número são obrigatórios.'
          : 'Subestação é obrigatória.',
        variant: 'destructive',
      })
      return
    }

    if (tipo === 'Para-raio de Linha') {
      const requiredFields = [
        'circuito',
        'modelo',
        'tensao_nominal',
        'corrente_descarga',
        'fabricante',
      ]
      const missing = requiredFields.filter((f) => !dados[f])
      if (missing.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos do Para-raio de Linha são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    if (tipo === 'Transformador de Corrente') {
      const requiredFieldsTC = [
        'subestacao',
        'circuito',
        'numero',
        'tipo_modelo',
        'classe_tensao',
        'corrente_primaria',
        'corrente_secundaria',
        'relacao',
        'exatidao',
        'isolacao',
        'duplo_secundario',
        'fabricante',
      ]
      const missingTC = requiredFieldsTC.filter((f) => dados[f] === undefined || dados[f] === '')
      if (missingTC.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos do Transformador de Corrente são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    if (tipo === 'Transformador de Potencial') {
      const requiredFieldsTP = [
        'subestacao',
        'circuito',
        'numero',
        'tipo_modelo',
        'tensao_primaria',
        'tensao_secundaria',
        'relacao',
        'potencia',
        'isolacao',
        'fabricante',
      ]
      const missingTP = requiredFieldsTP.filter((f) => dados[f] === undefined || dados[f] === '')
      if (missingTP.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos do Transformador de Potencial são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    if (tipo === 'QGBT') {
      const requiredFieldsQGBT = fields.map((f) => f.name)
      const missingQGBT = requiredFieldsQGBT.filter(
        (f) => dados[f] === undefined || dados[f] === '',
      )
      if (missingQGBT.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Todos os campos do QGBT são obrigatórios.',
          variant: 'destructive',
        })
        return
      }
    }

    onSave({ tipo_equipamento: tipo, dados_tecnicos: dados })
    onOpenChange(false)
  }

  const isFuseField = (f: FieldDef) => {
    const name = f.name.toLowerCase()
    const label = f.label.toLowerCase()
    return (
      name.includes('fusivel') ||
      name.includes('fusiveis') ||
      label.includes('fusível') ||
      label.includes('fusíveis')
    )
  }

  const renderField = (field: FieldDef) => {
    if (field.dependsOn && dados[field.dependsOn.field] !== field.dependsOn.value) {
      return null
    }

    if (tipo === 'Transformador' && dados.meio_isolante === 'Epóxi') {
      if (field.name === 'volume_oleo' || field.name === 'buchas') {
        return null
      }
    }

    const isCombobox =
      field.type === 'combobox' ||
      (tipo === 'Transformador de Potencial' && field.name === 'tensao_secundaria') ||
      (tipo === 'Transformador' && field.name === 'ligado_em') ||
      (tipo === 'Transformador de Corrente' &&
        (field.name === 'corrente_primaria' || field.name === 'corrente_secundaria'))

    let isSelect = false
    let targetCategory = field.name.toLowerCase()

    if (
      targetCategory === 'tensao_primaria' ||
      targetCategory === 'tensao_secundaria' ||
      targetCategory === 'ligado_em'
    )
      targetCategory = 'tensão'
    if (
      targetCategory === 'corrente_nominal' ||
      targetCategory === 'corrente_nominal_fusiveis' ||
      targetCategory === 'fusivel_corrente_nominal' ||
      targetCategory === 'corrente_primaria' ||
      targetCategory === 'corrente_secundaria' ||
      field.label.toLowerCase().includes('corrente nominal') ||
      field.label.toLowerCase().includes('corrente dos fusíveis')
    )
      targetCategory = 'corrente nominal'
    if (
      targetCategory === 'fabricante_fusiveis' ||
      field.label.toLowerCase().includes('fabricante dos fusíveis')
    )
      targetCategory = 'fabricante'
    if (targetCategory === 'potencia') targetCategory = 'potência'
    if (targetCategory === 'exatidao') targetCategory = 'exatidão'
    if (targetCategory === 'classe_tensao') targetCategory = 'tensão'
    if (targetCategory === 'isolacao') targetCategory = 'isolação'
    if (targetCategory === 'tap_at') targetCategory = 'tap de at (v)'

    if (field.type === 'select' && field.options) {
      isSelect = true
    } else if (
      !opcoesError &&
      !field.readOnly &&
      ([
        'corrente_nominal',
        'classe_isolamento',
        'potencia_simetrica',
        'capacidade_ruptura',
        'rele_minima_tensao',
        'rele_abertura',
        'rele_fechamento',
        'motorizacao',
        'tensao_primaria',
        'tensao_secundaria',
        'classe_tensao',
        'corrente_primaria',
        'corrente_secundaria',
        'ligado_em',
        'potencia',
        'classe_precisao',
        'exatidao',
        'isolacao',
        'corrente_nominal_fusiveis',
        'fabricante_fusiveis',
      ].includes(field.name) ||
        field.label.toLowerCase().includes('corrente nominal dos fusíveis') ||
        field.label.toLowerCase().includes('corrente dos fusíveis') ||
        field.label.toLowerCase().includes('fabricante dos fusíveis'))
    ) {
      isSelect = true
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label>
          {field.label}
          {(['subestacao', 'numero'].includes(field.name) ||
            (tipo === 'Estrutura' &&
              ['temperatura_ambiente', 'umidade_relativa'].includes(field.name)) ||
            (tipo === 'Para-raio de Linha' &&
              ['circuito', 'modelo', 'tensao_nominal', 'corrente_descarga', 'fabricante'].includes(
                field.name,
              )) ||
            (tipo === 'Transformador de Corrente' &&
              [
                'circuito',
                'tipo_modelo',
                'classe_tensao',
                'corrente_primaria',
                'corrente_secundaria',
                'relacao',
                'exatidao',
                'isolacao',
                'duplo_secundario',
                'fabricante',
              ].includes(field.name)) ||
            (tipo === 'Transformador de Potencial' &&
              [
                'circuito',
                'tipo_modelo',
                'tensao_primaria',
                'tensao_secundaria',
                'relacao',
                'potencia',
                'isolacao',
                'fabricante',
              ].includes(field.name)) ||
            tipo === 'Condutor Elétrico' ||
            tipo === 'Relé de Proteção' ||
            tipo === 'QGBT') && <span className="text-destructive"> *</span>}
        </Label>

        {isCombobox && !opcoesError ? (
          <ComboboxField
            field={field}
            value={dados[field.name]?.toString() || ''}
            onChange={(v) => {
              let finalVal: any = v
              if (field.type === 'number' && v !== '') {
                const clean = v.includes(',')
                  ? v.replace(/\./g, '').replace(',', '.')
                  : v.replace(/\./g, '')
                const num = Number(clean)
                if (!isNaN(num)) finalVal = num
              }
              handleFieldChange(field.name, finalVal)
            }}
            opcoes={opcoes}
            formatAsNumber={
              tipo === 'QGBT' || (tipo === 'Transformador' && field.name === 'impedancia')
            }
            overrideCategory={
              tipo === 'Relé de Proteção' && field.name === 'tipo_modelo'
                ? 'tipo/modelo do relé de proteção'
                : tipo === 'Relé de Proteção' && field.name.includes('curva')
                  ? 'curva do relé'
                  : ['tensao_secundaria', 'tensao_nominal', 'ligado_em', 'classe_tensao'].includes(
                        field.name,
                      )
                    ? 'Tensão'
                    : [
                          'corrente_primaria',
                          'corrente_secundaria',
                          'fusivel_corrente_nominal',
                          'corrente_nominal',
                          'corrente_ajuste_longo',
                          'corrente_ajuste_curto',
                          'corrente_ajuste_instantanea',
                        ].includes(field.name)
                      ? 'Corrente Nominal'
                      : field.name === 'exatidao'
                        ? 'Exatidão'
                        : field.name === 'tap_at'
                          ? 'Tap de AT (V)'
                          : undefined
            }
          />
        ) : isSelect ? (
          <Select
            value={(() => {
              let currentVal = dados[field.name]?.toString() || ''
              if (
                (tipo === 'QGBT' || (tipo === 'Transformador' && field.name === 'impedancia')) &&
                /^-?\d+(\.\d+)*(,\d+)?$/.test(currentVal.trim())
              ) {
                const cleanStr = currentVal.trim().replace(/\./g, '').replace(',', '.')
                const num = Number(cleanStr)
                if (!isNaN(num)) {
                  if (tipo === 'QGBT') {
                    if (
                      [
                        'corrente_ajuste_longo',
                        'temporizacao_longo',
                        'corrente_ajuste_curto',
                        'temporizacao_curto',
                        'corrente_ajuste_instantanea',
                      ].includes(field.name)
                    ) {
                      currentVal = formatNumberPtBR(num, 1, 1)
                    } else {
                      currentVal = formatNumberPtBR(num, 2, 2)
                    }
                  } else if (tipo === 'Transformador' && field.name === 'impedancia') {
                    currentVal = formatNumberPtBR(num, 2, 2)
                  } else {
                    currentVal = formatNumberPtBR(num)
                  }
                }
              }
              return currentVal
            })()}
            onValueChange={(v) => handleFieldChange(field.name, v)}
            disabled={loadingOpcoes}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingOpcoes ? 'Carregando...' : 'Selecione...'} />
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
                    !opcoes.some((op) => {
                      const cat = op.categoria.toLowerCase()
                      const matchesCategory =
                        cat === targetCategory ||
                        (targetCategory === 'tensão' && cat === 'tensao_primaria') ||
                        (targetCategory === 'corrente nominal' && cat === 'corrente_nominal') ||
                        (targetCategory === 'classe_isolamento' && cat === 'classe de isolamento')
                      return matchesCategory && String(op.valor) === String(dados[field.name])
                    }) && (
                      <SelectItem
                        value={(() => {
                          let customVal = String(dados[field.name])
                          if (
                            (tipo === 'QGBT' ||
                              (tipo === 'Transformador' && field.name === 'impedancia')) &&
                            /^-?\d+(\.\d+)*(,\d+)?$/.test(customVal.trim())
                          ) {
                            const cleanStr = customVal.trim().replace(/\./g, '').replace(',', '.')
                            const num = Number(cleanStr)
                            if (!isNaN(num)) {
                              if (tipo === 'QGBT') {
                                if (
                                  [
                                    'corrente_ajuste_longo',
                                    'temporizacao_longo',
                                    'corrente_ajuste_curto',
                                    'temporizacao_curto',
                                    'corrente_ajuste_instantanea',
                                  ].includes(field.name)
                                ) {
                                  customVal = formatNumberPtBR(num, 1, 1)
                                } else {
                                  customVal = formatNumberPtBR(num, 2, 2)
                                }
                              } else if (tipo === 'Transformador' && field.name === 'impedancia') {
                                customVal = formatNumberPtBR(num, 2, 2)
                              } else {
                                customVal = formatNumberPtBR(num)
                              }
                            }
                          }
                          return customVal
                        })()}
                      >
                        {(() => {
                          let customVal = String(dados[field.name])
                          if (
                            (tipo === 'QGBT' ||
                              (tipo === 'Transformador' && field.name === 'impedancia')) &&
                            /^-?\d+(\.\d+)*(,\d+)?$/.test(customVal.trim())
                          ) {
                            const cleanStr = customVal.trim().replace(/\./g, '').replace(',', '.')
                            const num = Number(cleanStr)
                            if (!isNaN(num)) {
                              if (tipo === 'QGBT') {
                                if (
                                  [
                                    'corrente_ajuste_longo',
                                    'temporizacao_longo',
                                    'corrente_ajuste_curto',
                                    'temporizacao_curto',
                                    'corrente_ajuste_instantanea',
                                  ].includes(field.name)
                                ) {
                                  customVal = formatNumberPtBR(num, 1, 1)
                                } else {
                                  customVal = formatNumberPtBR(num, 2, 2)
                                }
                              } else if (tipo === 'Transformador' && field.name === 'impedancia') {
                                customVal = formatNumberPtBR(num, 2, 2)
                              } else {
                                customVal = formatNumberPtBR(num)
                              }
                            }
                          }
                          return customVal
                        })()}{' '}
                      </SelectItem>
                    )}
                  {opcoes
                    .filter((o) => {
                      const cat = o.categoria.toLowerCase()
                      return (
                        cat === targetCategory ||
                        (targetCategory === 'tensão' && cat === 'tensao_primaria') ||
                        (targetCategory === 'corrente nominal' && cat === 'corrente_nominal') ||
                        (targetCategory === 'classe_isolamento' && cat === 'classe de isolamento')
                      )
                    })
                    .sort((a, b) => {
                      const isAlphabeticalOnly =
                        targetCategory === 'tipo/modelo do relé de proteção' ||
                        targetCategory === 'fabricante' ||
                        targetCategory.includes('fabricante') ||
                        targetCategory === 'diagrama'

                      if (isAlphabeticalOnly) {
                        return a.valor.localeCompare(b.valor, undefined, {
                          numeric: true,
                          sensitivity: 'base',
                        })
                      }

                      const parseBr = (val: string) => {
                        const match = val.match(/-?[\d.,]+/)
                        if (!match) return null
                        const cleanStr = match[0]
                        if (cleanStr === '.' || cleanStr === ',') return null
                        const numStr = cleanStr.replace(/\./g, '').replace(',', '.')
                        const num = parseFloat(numStr)
                        return isNaN(num) ? null : num
                      }
                      const numA = parseBr(a.valor)
                      const numB = parseBr(b.valor)
                      if (numA !== null && numB !== null) {
                        return numA - numB
                      }
                      return a.valor.localeCompare(b.valor, undefined, {
                        numeric: true,
                        sensitivity: 'base',
                      })
                    })
                    .map((o) => {
                      let displayVal = String(o.valor)
                      if (
                        (tipo === 'QGBT' ||
                          (tipo === 'Transformador' && field.name === 'impedancia')) &&
                        /^-?\d+(\.\d+)*(,\d+)?$/.test(displayVal.trim())
                      ) {
                        const cleanStr = displayVal.trim().replace(/\./g, '').replace(',', '.')
                        const num = Number(cleanStr)
                        if (!isNaN(num)) {
                          if (tipo === 'QGBT') {
                            if (
                              [
                                'corrente_ajuste_longo',
                                'temporizacao_longo',
                                'corrente_ajuste_curto',
                                'temporizacao_curto',
                                'corrente_ajuste_instantanea',
                              ].includes(field.name)
                            ) {
                              displayVal = formatNumberPtBR(num, 1, 1)
                            } else {
                              displayVal = formatNumberPtBR(num, 2, 2)
                            }
                          } else if (tipo === 'Transformador' && field.name === 'impedancia') {
                            displayVal = formatNumberPtBR(num, 2, 2)
                          } else {
                            displayVal = formatNumberPtBR(num)
                          }
                        }
                      }
                      return (
                        <SelectItem key={o.id} value={displayVal}>
                          {displayVal}
                        </SelectItem>
                      )
                    })}
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
        ) : tipo === 'Estrutura' &&
          (field.name === 'temperatura_ambiente' || field.name === 'umidade_relativa') ? (
          <EnvFieldInput
            field={field}
            value={dados[field.name]}
            onChange={(val) => handleFieldChange(field.name, val)}
          />
        ) : field.type === 'number' ? (
          <NumberInput
            value={dados[field.name] ?? ''}
            onChange={(val) => handleFieldChange(field.name, val)}
            placeholder={
              field.readOnly ? 'Calculado automaticamente' : `Insira ${field.label.toLowerCase()}`
            }
            readOnly={field.readOnly}
            className={field.readOnly ? 'bg-muted cursor-not-allowed' : ''}
            decimalScale={
              tipo === 'QGBT' &&
              [
                'corrente_ajuste_longo',
                'temporizacao_longo',
                'corrente_ajuste_curto',
                'temporizacao_curto',
                'corrente_ajuste_instantanea',
              ].includes(field.name)
                ? 1
                : tipo === 'QGBT'
                  ? 2
                  : tipo === 'Transformador' && field.name === 'impedancia'
                    ? 2
                    : undefined
            }
            minDecimals={
              tipo === 'QGBT' &&
              [
                'corrente_ajuste_longo',
                'temporizacao_longo',
                'corrente_ajuste_curto',
                'temporizacao_curto',
                'corrente_ajuste_instantanea',
              ].includes(field.name)
                ? 1
                : tipo === 'QGBT'
                  ? 2
                  : tipo === 'Transformador' && field.name === 'impedancia'
                    ? 2
                    : undefined
            }
          />
        ) : (
          <Input
            type="text"
            value={dados[field.name] ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onBlur={(e) => {
              if (
                (tipo === 'QGBT' || (tipo === 'Transformador' && field.name === 'impedancia')) &&
                e.target.value &&
                /^-?\d+(\.\d+)*(,\d+)?$/.test(e.target.value.trim())
              ) {
                const cleanStr = e.target.value.trim().replace(/\./g, '').replace(',', '.')
                const num = Number(cleanStr)
                if (!isNaN(num)) {
                  let formatted = formatNumberPtBR(num)
                  if (tipo === 'QGBT') {
                    if (
                      [
                        'corrente_ajuste_longo',
                        'temporizacao_longo',
                        'corrente_ajuste_curto',
                        'temporizacao_curto',
                        'corrente_ajuste_instantanea',
                      ].includes(field.name)
                    ) {
                      formatted = formatNumberPtBR(num, 1, 1)
                    } else {
                      formatted = formatNumberPtBR(num, 2, 2)
                    }
                  } else if (tipo === 'Transformador' && field.name === 'impedancia') {
                    formatted = formatNumberPtBR(num, 2, 2)
                  }
                  handleFieldChange(field.name, formatted)
                }
              }
            }}
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
            <div className="space-y-6 border-t pt-5 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {fields.filter((f) => !isFuseField(f) && !f.section).map(renderField)}
              </div>

              {Array.from(new Set(fields.filter((f) => f.section).map((f) => f.section))).map(
                (section) => (
                  <div
                    key={section!}
                    className="rounded-lg border border-border bg-card p-5 shadow-sm"
                  >
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      {section}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="space-y-4">
                        {section === 'Ajustes de Corrente' && (
                          <h4 className="text-xs font-semibold uppercase text-primary border-b pb-1 mb-3">
                            Fase
                          </h4>
                        )}
                        {fields
                          .filter((f) => f.section === section && f.column === 'left')
                          .map(renderField)}
                      </div>
                      <div className="space-y-4">
                        {section === 'Ajustes de Corrente' && (
                          <h4 className="text-xs font-semibold uppercase text-primary border-b pb-1 mb-3">
                            Neutro
                          </h4>
                        )}
                        {fields
                          .filter((f) => f.section === section && f.column === 'right')
                          .map(renderField)}
                      </div>
                    </div>
                  </div>
                ),
              )}

              {fields.some((f) => isFuseField(f)) && (
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    Informações dos Fusíveis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {fields.filter((f) => isFuseField(f)).map(renderField)}
                  </div>
                </div>
              )}
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
