import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { getOpcoesPadronizadas, type OpcaoPadronizada } from '@/services/opcoes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TestItem } from '@/types/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const testSchema = z
  .object({
    tipo_teste: z.enum(
      [
        'Resistências dos Isolamentos',
        'Relação de Tensões',
        'Resistências dos Enrolamentos',
        'Resistências dos Contatos',
      ],
      {
        required_error: 'Este campo é obrigatório',
      },
    ),
    tipo_equipamento_ref: z.string().optional(),
    equipamento_utilizado: z.array(z.string()).min(1, 'Selecione ao menos um equipamento'),
    valor_teste: z.union([z.coerce.number(), z.string()]).optional(),
    unidade: z.string().optional(),
    data_teste: z.string().min(1, 'Este campo é obrigatório'),
    dados_detalhados: z.any().optional(),
    observacoes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_teste === 'Relação de Tensões') {
      if (data.tipo_equipamento_ref === 'Transformador') {
        const d = data.dados_detalhados || {}
        if (!d.posicao) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.posicao'],
            message: 'Este campo é obrigatório',
          })
        }
        if (d.h1h3_x0x1 === undefined || d.h1h3_x0x1 === null || d.h1h3_x0x1 === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.h1h3_x0x1'],
            message: 'Este campo é obrigatório',
          })
        }
        if (d.h2h1_x0x2 === undefined || d.h2h1_x0x2 === null || d.h2h1_x0x2 === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.h2h1_x0x2'],
            message: 'Este campo é obrigatório',
          })
        }
        if (d.h3h2_x0x3 === undefined || d.h3h2_x0x3 === null || d.h3h2_x0x3 === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.h3h2_x0x3'],
            message: 'Este campo é obrigatório',
          })
        }
      } else {
        const tp = data.dados_detalhados?.tensao_primaria
        const ts = data.dados_detalhados?.tensao_secundaria

        if (tp === undefined || tp === null || tp === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.tensao_primaria'],
            message: 'Este campo é obrigatório',
          })
        }
        if (ts === undefined || ts === null || ts === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.tensao_secundaria'],
            message: 'Este campo é obrigatório',
          })
        } else if (Number(ts) === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dados_detalhados.tensao_secundaria'],
            message: 'A tensão secundária não pode ser zero.',
          })
        }
      }
    }

    if (data.tipo_teste === 'Resistências dos Contatos') {
      const fa = data.dados_detalhados?.fase_a
      const fb = data.dados_detalhados?.fase_b
      const fc = data.dados_detalhados?.fase_c

      if (fa === undefined || fa === null || fa === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dados_detalhados.fase_a'],
          message: 'Este campo é obrigatório',
        })
      }
      if (fb === undefined || fb === null || fb === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dados_detalhados.fase_b'],
          message: 'Este campo é obrigatório',
        })
      }
      if (fc === undefined || fc === null || fc === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dados_detalhados.fase_c'],
          message: 'Este campo é obrigatório',
        })
      }
    }

    if (data.tipo_teste === 'Resistências dos Isolamentos') {
      if (data.tipo_equipamento_ref === 'Condutor Elétrico') {
        const rows = ['fase_a', 'fase_b', 'fase_c']
        rows.forEach((r) => {
          const v1 = data.dados_detalhados?.[r]?.v1
          const v2 = data.dados_detalhados?.[r]?.v2
          if (v1 === undefined || v1 === null || String(v1) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.${r}.v1`],
              message: 'Obrigatório',
            })
          }
          if (v2 === undefined || v2 === null || String(v2) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.${r}.v2`],
              message: 'Obrigatório',
            })
          }
        })
      } else if (data.tipo_equipamento_ref === 'Disjuntor') {
        const rowsFechado = ['ab', 'bc', 'ac', 'abc_massa']
        const rowsAberto = ['aa', 'bb', 'cc']
        rowsFechado.forEach((r) => {
          const v1 = data.dados_detalhados?.fechado?.[r]?.v1
          const v2 = data.dados_detalhados?.fechado?.[r]?.v2
          if (v1 === undefined || v1 === null || String(v1) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.fechado.${r}.v1`],
              message: 'Obrigatório',
            })
          }
          if (v2 === undefined || v2 === null || String(v2) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.fechado.${r}.v2`],
              message: 'Obrigatório',
            })
          }
        })
        rowsAberto.forEach((r) => {
          const v1 = data.dados_detalhados?.aberto?.[r]?.v1
          const v2 = data.dados_detalhados?.aberto?.[r]?.v2
          if (v1 === undefined || v1 === null || String(v1) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.aberto.${r}.v1`],
              message: 'Obrigatório',
            })
          }
          if (v2 === undefined || v2 === null || String(v2) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.aberto.${r}.v2`],
              message: 'Obrigatório',
            })
          }
        })
      } else if (
        data.tipo_equipamento_ref === 'Transformador de Potencial' ||
        data.tipo_equipamento_ref === 'Transformador de Corrente'
      ) {
        const rows = ['A', 'B', 'C']
        rows.forEach((r) => {
          const v1 = data.dados_detalhados?.fases?.[r]?.valor1
          const v2 = data.dados_detalhados?.fases?.[r]?.valor2
          if (v1 === undefined || v1 === null || String(v1) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.fases.${r}.valor1`],
              message: 'Obrigatório',
            })
          }
          if (v2 === undefined || v2 === null || String(v2) === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.fases.${r}.valor2`],
              message: 'Obrigatório',
            })
          }
        })
      } else {
        const rows = ['ab', 'bc', 'ac', 'abc_massa']
        rows.forEach((r) => {
          const v1 = data.dados_detalhados?.[r]?.v1
          const v2 = data.dados_detalhados?.[r]?.v2
          if (v1 === undefined || v1 === null || v1 === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.${r}.v1`],
              message: 'Obrigatório',
            })
          }
          if (v2 === undefined || v2 === null || v2 === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`dados_detalhados.${r}.v2`],
              message: 'Obrigatório',
            })
          }
        })
      }
    }

    if (data.tipo_teste === 'Resistências dos Enrolamentos') {
      const ets = data.dados_detalhados?.ets || {}
      const eti = data.dados_detalhados?.eti || {}

      const reqFieldsETS = ['h1_h3', 'h2_h1', 'h3_h2']
      reqFieldsETS.forEach((f) => {
        if (ets[f] === undefined || ets[f] === null || String(ets[f]) === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`dados_detalhados.ets.${f}`],
            message: 'Obrigatório',
          })
        }
      })

      const reqFieldsETI = ['x1_x3', 'x2_x1', 'x3_x2']
      reqFieldsETI.forEach((f) => {
        if (eti[f] === undefined || eti[f] === null || String(eti[f]) === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`dados_detalhados.eti.${f}`],
            message: 'Obrigatório',
          })
        }
      })
    }

    if (
      data.tipo_teste !== 'Resistências dos Contatos' &&
      data.tipo_teste !== 'Resistências dos Isolamentos' &&
      data.tipo_teste !== 'Resistências dos Enrolamentos' &&
      !(data.tipo_teste === 'Relação de Tensões' && data.tipo_equipamento_ref === 'Transformador')
    ) {
      if (data.valor_teste === undefined || data.valor_teste === null || data.valor_teste === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor_teste'],
          message: 'Este campo é obrigatório',
        })
      }
    }

    if (data.unidade === undefined || data.unidade === null || data.unidade === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unidade'],
        message: 'Este campo é obrigatório',
      })
    }
  })

type TestFormValues = z.infer<typeof testSchema>

interface TestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (test: TestItem) => void
  initialData?: TestItem
  equipmentType?: string
  equipmentData?: Record<string, any>
  allTests?: TestItem[]
}

const isoRows = [
  { id: 'ab', label: 'A x B' },
  { id: 'bc', label: 'B x C' },
  { id: 'ac', label: 'C x A' },
  { id: 'abc_massa', label: 'A, B, C x Massa' },
]

const disjuntorFechadoRows = [
  { id: 'ab', label: 'A x B' },
  { id: 'bc', label: 'B x C' },
  { id: 'ac', label: 'C x A' },
  { id: 'abc_massa', label: 'A, B, C x Massa' },
]

const disjuntorAbertoRows = [
  { id: 'aa', label: 'A x A' },
  { id: 'bb', label: 'B x B' },
  { id: 'cc', label: 'C x C' },
]

const CATEGORY_MAP: Record<string, string> = {
  'Resistências dos Isolamentos': 'equipamento_isolamento',
  'Relação de Tensões': 'equipamento_relacao',
  'Resistências dos Enrolamentos': 'equipamento_enrolamento',
  'Resistências dos Contatos': 'equipamento_contatos',
}

const FACTOR_75: Record<number, number> = {
  0: 181,
  1: 169,
  2: 158,
  3: 147,
  4: 137,
  5: 128,
  6: 119,
  7: 111,
  8: 104,
  9: 97,
  10: 91,
  11: 84,
  12: 79,
  13: 74,
  14: 69,
  15: 64,
  16: 60,
  17: 56,
  18: 52,
  19: 48.5,
  20: 45.3,
  21: 42.2,
  22: 39.4,
  23: 36.8,
  24: 34.3,
  25: 32,
  26: 29.9,
  27: 27.9,
  28: 26,
  29: 24.3,
  30: 22.6,
  31: 21.1,
  32: 19.7,
  33: 18.4,
  34: 17.2,
  35: 16,
  36: 14.9,
  37: 13.9,
  38: 13,
  39: 12.1,
  40: 11.3,
  41: 10.6,
  42: 9.9,
  43: 9.2,
  44: 8.6,
  45: 8,
  46: 7.5,
  47: 7,
  48: 6.5,
  49: 6.1,
  50: 5.7,
  51: 5.3,
  52: 4.92,
  53: 4.59,
  54: 4.29,
  55: 4,
  56: 3.73,
  57: 3.48,
  58: 3.25,
  59: 3.03,
  60: 2.83,
  61: 2.64,
  62: 2.46,
  63: 2.3,
  64: 2.14,
  65: 2,
  66: 1.87,
  67: 1.74,
  68: 1.62,
  69: 1.52,
  70: 1.41,
  71: 1.32,
  72: 1.25,
  73: 1.15,
  74: 1.07,
  75: 1,
  76: 0.93,
  77: 0.87,
  78: 0.81,
  79: 0.76,
  80: 0.71,
  81: 0.66,
  82: 0.61,
}

const FACTOR_105: Record<number, number> = {
  41: 84,
  42: 79,
  43: 74,
  44: 69,
  45: 64,
  46: 60,
  47: 56,
  48: 52,
  49: 48.5,
  50: 45.3,
  51: 42.2,
  52: 39.4,
  53: 36.8,
  54: 34.3,
  55: 32,
  56: 29.9,
  57: 27.9,
  58: 26,
  59: 24.3,
  60: 22.6,
  61: 21.1,
  62: 19.7,
  63: 18.4,
  64: 17.2,
  65: 16,
  66: 14.9,
  67: 13.9,
  68: 13,
  69: 12.1,
  70: 11.3,
  71: 10.6,
  72: 9.9,
  73: 9.2,
  74: 8.6,
  75: 8,
  76: 7.5,
  77: 7,
  78: 6.5,
  79: 6.1,
  80: 5.7,
  81: 5.3,
  82: 4.92,
  83: 4.59,
  84: 4.29,
  85: 4,
  86: 3.73,
  87: 3.48,
  88: 3.25,
  89: 3.03,
  90: 2.83,
  91: 2.64,
  92: 2.46,
  93: 2.3,
  94: 2.14,
  95: 2,
  96: 1.87,
  97: 1.74,
  98: 1.62,
  99: 1.52,
  100: 1.41,
}

export function TestModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  equipmentType,
  equipmentData,
  allTests,
}: TestModalProps) {
  const [equipmentOptions, setEquipmentOptions] = useState<OpcaoPadronizada[]>([])

  const [ligadoEm, setLigadoEm] = useState<number | null>(null)
  const [tensaoSecundaria, setTensaoSecundaria] = useState<number | null>(null)

  useEffect(() => {
    if (open && equipmentType === 'Transformador' && equipmentData) {
      const leVal =
        equipmentData?.ligado_em_v ??
        equipmentData?.ligado_em ??
        equipmentData?.['Ligado em (V)'] ??
        equipmentData?.['Ligado em']
      const tsVal =
        equipmentData?.tensao_secundaria_v ??
        equipmentData?.tensao_secundaria ??
        equipmentData?.['Tensão Secundária (V)'] ??
        equipmentData?.['Tensão Secundária']

      const leStr = String(leVal ?? '')
        .replace(/\./g, '')
        .replace(',', '.')
      const le = parseFloat(leStr)

      const tsMatch = String(tsVal ?? '')
        .split('/')[0]
        .replace(/\./g, '')
        .replace(',', '.')
      const ts = parseFloat(tsMatch)

      setLigadoEm(isNaN(le) ? null : le)
      setTensaoSecundaria(isNaN(ts) ? null : ts)
    } else {
      setLigadoEm(null)
      setTensaoSecundaria(null)
    }
  }, [open, equipmentType, equipmentData])

  const relacaoCalculada =
    ligadoEm !== null && tensaoSecundaria !== null && tensaoSecundaria !== 0
      ? (ligadoEm / tensaoSecundaria) * Math.sqrt(3)
      : null

  const relacaoMais = relacaoCalculada !== null ? relacaoCalculada * 1.005 : null
  const relacaoMenos = relacaoCalculada !== null ? relacaoCalculada * 0.995 : null

  const meioIsolante =
    equipmentData?.meio_isolante || equipmentData?.['Meio Isolante'] || 'Óleo Mineral'
  const isoTest = allTests?.find(
    (t) => t.tipo_teste === 'Resistências dos Isolamentos' && !t._delete,
  )
  const tempMedidaSource = isoTest?.dados_detalhados?.temperatura

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      equipamento_utilizado: [],
      valor_teste: 0,
      unidade: '',
      data_teste: new Date().toISOString().split('T')[0],
      dados_detalhados: {},
      observacoes: '',
    },
  })

  const watchTipo = form.watch('tipo_teste')
  const watchUnidade = form.watch('unidade')

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          tipo_teste: initialData.tipo_teste as any,
          tipo_equipamento_ref: equipmentType,
          equipamento_utilizado: initialData.equipamento_utilizado
            ? initialData.equipamento_utilizado.split(', ')
            : [],
          valor_teste: initialData.valor_teste,
          unidade: initialData.unidade,
          data_teste: initialData.data_teste,
          dados_detalhados: initialData.dados_detalhados || {},
          observacoes: initialData.observacoes || '',
        })
      } else {
        form.reset({
          tipo_teste: undefined as any,
          tipo_equipamento_ref: equipmentType,
          equipamento_utilizado: [],
          valor_teste: 0,
          unidade: '',
          data_teste: new Date().toISOString().split('T')[0],
          dados_detalhados: {},
          observacoes: '',
        })
      }
    }
  }, [open, initialData, form, equipmentType])

  useEffect(() => {
    if (
      watchTipo === 'Resistências dos Enrolamentos' &&
      open &&
      equipmentType === 'Transformador'
    ) {
      if (!initialData?.dados_detalhados?.temperatura_medida && tempMedidaSource) {
        form.setValue('dados_detalhados.temperatura_medida', Math.round(Number(tempMedidaSource)))
      }
    }
  }, [watchTipo, open, tempMedidaSource, initialData, equipmentType, form])

  const tempMedida = form.watch('dados_detalhados.temperatura_medida')
  const isEpoxy = meioIsolante === 'Epóxi'
  const ets = form.watch('dados_detalhados.ets')
  const eti = form.watch('dados_detalhados.eti')

  let currentFactor: number | null = null
  if (tempMedida !== undefined && tempMedida !== null && tempMedida !== '') {
    const t = Math.round(Number(tempMedida))
    if (isEpoxy) {
      const clamped = t < 41 ? 41 : t > 100 ? 100 : t
      currentFactor = FACTOR_105[clamped] ?? null
    } else {
      const clamped = t < 0 ? 0 : t > 82 ? 82 : t
      currentFactor = FACTOR_75[clamped] ?? null
    }
  }

  useEffect(() => {
    if (!open) return

    if (watchTipo) {
      const cat = CATEGORY_MAP[watchTipo]
      if (cat) {
        getOpcoesPadronizadas(cat)
          .then((options) => {
            setEquipmentOptions(options)
            const current = form.getValues('equipamento_utilizado') || []
            const valid = current.filter((c) => options.find((o) => o.valor === c))
            if (valid.length !== current.length) {
              form.setValue('equipamento_utilizado', valid, { shouldValidate: true })
            }
          })
          .catch(console.error)
      } else {
        setEquipmentOptions([])
      }
    } else {
      setEquipmentOptions([])
    }

    if (watchTipo === 'Resistências dos Contatos') {
      form.setValue('unidade', 'Micro-Ohm', { shouldValidate: true })
      form.setValue('valor_teste', 0, { shouldValidate: true })
    } else if (watchTipo === 'Resistências dos Isolamentos') {
      form.setValue('unidade', 'Mega-Ohms', { shouldValidate: true })
      form.setValue('valor_teste', 0, { shouldValidate: true })
    } else if (watchTipo === 'Relação de Tensões') {
      if (equipmentType === 'Transformador') {
        form.setValue('unidade', 'V', { shouldValidate: true })
        form.setValue('valor_teste', 0, { shouldValidate: true })
        const currentObs = form.getValues('observacoes')
        if (!currentObs) {
          form.setValue('observacoes', 'Nota: Em conformidade com a norma ABNT NBR 5356/81.', {
            shouldValidate: true,
          })
        }
      } else {
        form.setValue('unidade', 'V', { shouldValidate: true })
      }
    } else if (watchTipo === 'Resistências dos Enrolamentos') {
      form.setValue('unidade', 'Ω / mΩ', { shouldValidate: true })
      form.setValue('valor_teste', 0, { shouldValidate: true })
      const currentObs = form.getValues('observacoes')
      if (!currentObs) {
        form.setValue('observacoes', 'Nota: Os enrolamentos apresentam boa condução elétrica.', {
          shouldValidate: true,
        })
      }
    }
  }, [watchTipo, form, open])

  const tp = form.watch('dados_detalhados.tensao_primaria')
  const ts = form.watch('dados_detalhados.tensao_secundaria')

  useEffect(() => {
    if (watchTipo === 'Relação de Tensões' && equipmentType !== 'Transformador' && open) {
      const prim = Number(tp)
      const sec = Number(ts)
      if (!isNaN(prim) && !isNaN(sec) && sec !== 0) {
        form.setValue('valor_teste', Number((prim / sec).toFixed(4)), { shouldValidate: true })
      } else {
        form.setValue('valor_teste', 0, { shouldValidate: true })
      }
    }
  }, [tp, ts, watchTipo, form, open, equipmentType])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Teste' : 'Adicionar Teste'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              const payload = {
                ...data,
                equipamento_utilizado: data.equipamento_utilizado.join(', '),
                valor_teste: Number(data.valor_teste) || 0,
              } as Record<string, any>

              if (
                payload.tipo_teste === 'Resistências dos Isolamentos' &&
                equipmentType === 'Condutor Elétrico' &&
                payload.dados_detalhados
              ) {
                const phases = ['fase_a', 'fase_b', 'fase_c', 'reserva']
                let minVal = Infinity
                phases.forEach((p) => {
                  if (payload.dados_detalhados[p]) {
                    const v1 = Number(payload.dados_detalhados[p].v1) || 0
                    const v2 = Number(payload.dados_detalhados[p].v2) || 0
                    const res = v1 * v2
                    payload.dados_detalhados[p].resultado = res
                    if (res > 0 && res < minVal) minVal = res
                  }
                })
                if (minVal !== Infinity) {
                  payload.valor_teste = minVal
                }
              } else if (
                payload.tipo_teste === 'Resistências dos Isolamentos' &&
                (equipmentType === 'Transformador de Potencial' ||
                  equipmentType === 'Transformador de Corrente') &&
                payload.dados_detalhados?.fases
              ) {
                const phases = ['A', 'B', 'C']
                let total = 0
                let count = 0
                phases.forEach((p) => {
                  if (payload.dados_detalhados.fases[p]) {
                    const v1 = Number(payload.dados_detalhados.fases[p].valor1) || 0
                    const v2 = Number(payload.dados_detalhados.fases[p].valor2) || 0
                    const res = v1 * v2
                    payload.dados_detalhados.fases[p].resultado = res
                    total += res
                    count++
                  }
                })
                if (count > 0) {
                  payload.valor_teste = total / count
                }
              } else if (
                payload.tipo_teste === 'Resistências dos Isolamentos' &&
                equipmentType === 'Disjuntor' &&
                payload.dados_detalhados
              ) {
                let minVal = Infinity
                if (payload.dados_detalhados.fechado) {
                  ;['ab', 'bc', 'ac', 'abc_massa'].forEach((p) => {
                    if (payload.dados_detalhados.fechado[p]) {
                      const v1 = Number(payload.dados_detalhados.fechado[p].v1) || 0
                      const v2 = Number(payload.dados_detalhados.fechado[p].v2) || 0
                      const res = v1 * v2
                      payload.dados_detalhados.fechado[p].resultado = res
                      if (res > 0 && res < minVal) minVal = res
                    }
                  })
                }
                if (payload.dados_detalhados.aberto) {
                  ;['aa', 'bb', 'cc'].forEach((p) => {
                    if (payload.dados_detalhados.aberto[p]) {
                      const v1 = Number(payload.dados_detalhados.aberto[p].v1) || 0
                      const v2 = Number(payload.dados_detalhados.aberto[p].v2) || 0
                      const res = v1 * v2
                      payload.dados_detalhados.aberto[p].resultado = res
                      if (res > 0 && res < minVal) minVal = res
                    }
                  })
                }
                if (minVal !== Infinity) {
                  payload.valor_teste = minVal
                }
              } else if (
                payload.tipo_teste === 'Resistências dos Isolamentos' &&
                payload.dados_detalhados &&
                ![
                  'Condutor Elétrico',
                  'Transformador de Potencial',
                  'Transformador de Corrente',
                  'Disjuntor',
                ].includes(equipmentType || '')
              ) {
                let minVal = Infinity
                const rows = ['ab', 'bc', 'ac', 'abc_massa']
                rows.forEach((p) => {
                  if (payload.dados_detalhados[p]) {
                    const v1 = Number(payload.dados_detalhados[p].v1) || 0
                    const v2 = Number(payload.dados_detalhados[p].v2) || 0
                    const res = v1 * v2
                    payload.dados_detalhados[p].resultado = res
                    if (res > 0 && res < minVal) minVal = res
                  }
                })
                if (minVal !== Infinity) {
                  payload.valor_teste = minVal
                }
              } else if (
                payload.tipo_teste === 'Resistências dos Enrolamentos' &&
                payload.dados_detalhados
              ) {
                payload.valor_teste = 0
                if (equipmentType === 'Transformador') {
                  const tMedidaRaw = payload.dados_detalhados.temperatura_medida
                  const tMedida =
                    tMedidaRaw !== undefined && tMedidaRaw !== ''
                      ? Math.round(Number(tMedidaRaw))
                      : NaN
                  const isEpoxi = meioIsolante === 'Epóxi'
                  const tRef = isEpoxi ? 105 : 75
                  payload.dados_detalhados.temperatura_referencia = tRef

                  if (!isNaN(tMedida)) {
                    payload.dados_detalhados.temperatura_medida = tMedida
                    let k = null
                    if (isEpoxi) {
                      const clamped = tMedida < 41 ? 41 : tMedida > 100 ? 100 : tMedida
                      k = FACTOR_105[clamped] ?? null
                    } else {
                      const clamped = tMedida < 0 ? 0 : tMedida > 82 ? 82 : tMedida
                      k = FACTOR_75[clamped] ?? null
                    }

                    if (k !== null) {
                      payload.dados_detalhados.fator_correcao = k
                      payload.dados_detalhados.ets_corr = {
                        h1_h3: payload.dados_detalhados.ets?.h1_h3
                          ? (Number(payload.dados_detalhados.ets.h1_h3) * k).toFixed(4)
                          : '',
                        h2_h1: payload.dados_detalhados.ets?.h2_h1
                          ? (Number(payload.dados_detalhados.ets.h2_h1) * k).toFixed(4)
                          : '',
                        h3_h2: payload.dados_detalhados.ets?.h3_h2
                          ? (Number(payload.dados_detalhados.ets.h3_h2) * k).toFixed(4)
                          : '',
                      }
                      payload.dados_detalhados.eti_corr = {
                        x1_x3: payload.dados_detalhados.eti?.x1_x3
                          ? (Number(payload.dados_detalhados.eti.x1_x3) * k).toFixed(4)
                          : '',
                        x2_x1: payload.dados_detalhados.eti?.x2_x1
                          ? (Number(payload.dados_detalhados.eti.x2_x1) * k).toFixed(4)
                          : '',
                        x3_x2: payload.dados_detalhados.eti?.x3_x2
                          ? (Number(payload.dados_detalhados.eti.x3_x2) * k).toFixed(4)
                          : '',
                      }
                    }
                  }
                }
              } else if (
                payload.tipo_teste === 'Relação de Tensões' &&
                equipmentType === 'Transformador'
              ) {
                payload.valor_teste = 0
                payload.dados_detalhados = {
                  ...payload.dados_detalhados,
                  relacao_teorica: relacaoCalculada,
                  relacao_mais_05: relacaoMais,
                  relacao_menos_05: relacaoMenos,
                  ligado_em: ligadoEm,
                  tensao_secundaria: tensaoSecundaria,
                }
              } else if (
                payload.tipo_teste === 'Resistências dos Contatos' &&
                payload.dados_detalhados
              ) {
                let maxVal = -Infinity
                const phases = ['fase_a', 'fase_b', 'fase_c']
                phases.forEach((p) => {
                  if (
                    payload.dados_detalhados[p] !== undefined &&
                    payload.dados_detalhados[p] !== ''
                  ) {
                    const v = Number(payload.dados_detalhados[p])
                    if (!isNaN(v) && v > maxVal) maxVal = v
                  }
                })
                if (maxVal !== -Infinity) {
                  payload.valor_teste = maxVal
                }
              }

              delete payload.tipo_equipamento_ref
              onSave(payload as unknown as TestItem)
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="tipo_teste"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tipo de Teste <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Resistências dos Isolamentos">
                        Resistências dos Isolamentos
                      </SelectItem>
                      {(equipmentType === 'Transformador' ||
                        field.value === 'Relação de Tensões') && (
                        <SelectItem value="Relação de Tensões">Relação de Tensões</SelectItem>
                      )}
                      {(equipmentType === 'Transformador' ||
                        field.value === 'Resistências dos Enrolamentos') && (
                        <SelectItem value="Resistências dos Enrolamentos">
                          Resistências dos Enrolamentos
                        </SelectItem>
                      )}
                      {(equipmentType !== 'Transformador' ||
                        field.value === 'Resistências dos Contatos') && (
                        <SelectItem value="Resistências dos Contatos">
                          Resistências dos Contatos
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipamento_utilizado"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Equipamento Utilizado <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between h-auto min-h-[2.5rem] py-2',
                            !field.value?.length && 'text-muted-foreground',
                            form.formState.errors.equipamento_utilizado &&
                              'border-destructive focus-visible:ring-destructive',
                          )}
                          disabled={!watchTipo || equipmentOptions.length === 0}
                        >
                          <div className="flex flex-wrap gap-1 text-left">
                            {field.value && field.value.length > 0 ? (
                              field.value.map((val) => (
                                <Badge variant="secondary" key={val} className="font-normal">
                                  {val}
                                </Badge>
                              ))
                            ) : (
                              <span>Selecione o(s) equipamento(s)...</span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar equipamento..." />
                        <CommandList>
                          <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                          <CommandGroup>
                            {equipmentOptions.map((opt) => {
                              const isSelected = field.value?.includes(opt.valor)
                              return (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.valor}
                                  onSelect={() => {
                                    const current = field.value || []
                                    const updated = isSelected
                                      ? current.filter((val) => val !== opt.valor)
                                      : [...current, opt.valor]
                                    field.onChange(updated)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      isSelected ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {opt.valor}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchTipo === 'Resistências dos Enrolamentos' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                {equipmentType === 'Transformador' && (
                  <div className="flex flex-col md:flex-row gap-4 mb-4 border-b pb-4 border-border">
                    <FormField
                      control={form.control}
                      name="dados_detalhados.temperatura_medida"
                      render={({ field }) => (
                        <FormItem className="flex-1 max-w-[250px]">
                          <FormLabel className="text-xs">Temperatura Medida (°C)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              className="h-8 text-xs"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? '' : Math.round(Number(e.target.value)),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <div className="flex-1 max-w-[250px] space-y-2">
                      <FormLabel className="text-xs text-muted-foreground block font-medium">
                        Fator de Correção {isEpoxy ? '105ºC' : '75ºC'}
                      </FormLabel>
                      <div className="h-8 flex items-center px-3 border rounded-md bg-muted text-xs text-muted-foreground">
                        {currentFactor !== null ? currentFactor : '-'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium border-b pb-2">ETS (Alta Tensão)</h4>
                    <div className="space-y-3">
                      {[
                        { id: 'h1_h3', label: 'H1 - H3' },
                        { id: 'h2_h1', label: 'H2 - H1' },
                        { id: 'h3_h2', label: 'H3 - H2' },
                      ].map((r) => {
                        const rawVal = ets?.[r.id]
                        const corrVal =
                          rawVal && currentFactor !== null
                            ? (Number(rawVal) * currentFactor).toFixed(4)
                            : null
                        return (
                          <FormField
                            key={r.id}
                            control={form.control}
                            name={`dados_detalhados.ets.${r.id}` as any}
                            render={({ field }) => (
                              <FormItem className="flex flex-col gap-1 space-y-0 relative pb-1">
                                <div className="flex items-center gap-4">
                                  <FormLabel className="text-xs w-16 text-right font-semibold shrink-0">
                                    {r.label} <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <div className="flex-1 relative">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        className="h-8 text-xs pr-8"
                                        value={field.value ?? ''}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value === '' ? '' : Number(e.target.value),
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                                      Ω
                                    </span>
                                  </div>
                                </div>
                                {currentFactor !== null && equipmentType === 'Transformador' && (
                                  <div className="flex items-center gap-4 mt-1">
                                    <div className="w-16 shrink-0" />
                                    <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded w-full flex justify-between items-center">
                                      <span>Corr. {isEpoxy ? '105' : '75'}ºC:</span>
                                      <span className="font-medium text-foreground">
                                        {corrVal ? `${corrVal} Ω` : '-'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium border-b pb-2">ETI (Baixa Tensão)</h4>
                    <div className="space-y-3">
                      {[
                        { id: 'x1_x3', label: 'X1 - X3' },
                        { id: 'x2_x1', label: 'X2 - X1' },
                        { id: 'x3_x2', label: 'X3 - X2' },
                      ].map((r) => {
                        const rawVal = eti?.[r.id]
                        const corrVal =
                          rawVal && currentFactor !== null
                            ? (Number(rawVal) * currentFactor).toFixed(4)
                            : null
                        return (
                          <FormField
                            key={r.id}
                            control={form.control}
                            name={`dados_detalhados.eti.${r.id}` as any}
                            render={({ field }) => (
                              <FormItem className="flex flex-col gap-1 space-y-0 relative pb-1">
                                <div className="flex items-center gap-4">
                                  <FormLabel className="text-xs w-16 text-right font-semibold shrink-0">
                                    {r.label} <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <div className="flex-1 relative">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        className="h-8 text-xs pr-10"
                                        value={field.value ?? ''}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value === '' ? '' : Number(e.target.value),
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                                      mΩ
                                    </span>
                                  </div>
                                </div>
                                {currentFactor !== null && equipmentType === 'Transformador' && (
                                  <div className="flex items-center gap-4 mt-1">
                                    <div className="w-16 shrink-0" />
                                    <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded w-full flex justify-between items-center">
                                      <span>Corr. {isEpoxy ? '105' : '75'}ºC:</span>
                                      <span className="font-medium text-foreground">
                                        {corrVal ? `${corrVal} mΩ` : '-'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {watchTipo === 'Resistências dos Contatos' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="text-sm font-medium">Medições das Fases</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dados_detalhados.fase_a"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Fase A <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.fase_b"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Fase B <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.fase_c"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Fase C <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {watchTipo === 'Relação de Tensões' && equipmentType === 'Transformador' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="text-sm font-medium">Dados Técnicos - Relação de Tensões</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <FormLabel className="text-xs text-muted-foreground">Ligado em (V)</FormLabel>
                    <div className="text-sm font-medium">
                      {ligadoEm !== null ? new Intl.NumberFormat('pt-BR').format(ligadoEm) : '-'}
                    </div>
                  </div>
                  <div>
                    <FormLabel className="text-xs text-muted-foreground">
                      Tensão Secundária (V)
                    </FormLabel>
                    <div className="text-sm font-medium">
                      {tensaoSecundaria !== null
                        ? new Intl.NumberFormat('pt-BR').format(tensaoSecundaria)
                        : '-'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <FormLabel className="text-xs text-muted-foreground">
                      Relação (Teórica) (V)
                    </FormLabel>
                    <div className="text-sm font-medium">
                      {relacaoCalculada
                        ? new Intl.NumberFormat('pt-BR', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          }).format(relacaoCalculada)
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <FormLabel className="text-xs text-muted-foreground">
                      Relação +0,50% (V)
                    </FormLabel>
                    <div className="text-sm font-medium">
                      {relacaoMais
                        ? new Intl.NumberFormat('pt-BR', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          }).format(relacaoMais)
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <FormLabel className="text-xs text-muted-foreground">
                      Relação -0,50% (V)
                    </FormLabel>
                    <div className="text-sm font-medium">
                      {relacaoMenos
                        ? new Intl.NumberFormat('pt-BR', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          }).format(relacaoMenos)
                        : '-'}
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-medium border-t pt-4">Medições</h4>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="dados_detalhados.posicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Posição <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} className="h-8 text-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="dados_detalhados.h1h3_x0x1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          H1H3/X0X1 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value ?? ''}
                            className="h-8 text-sm"
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.h2h1_x0x2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          H2H1/X0X2 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value ?? ''}
                            className="h-8 text-sm"
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.h3h2_x0x3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          H3H2/X0X3 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value ?? ''}
                            className="h-8 text-sm"
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {watchTipo === 'Relação de Tensões' && equipmentType !== 'Transformador' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="text-sm font-medium">Cálculo de Relação de Tensões</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dados_detalhados.tensao_primaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Tensão Primária <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.tensao_secundaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Tensão Secundária <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {watchTipo === 'Resistências dos Isolamentos' &&
              (equipmentType === 'Condutor Elétrico' ? (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <h4 className="text-sm font-medium">Medições de Isolamento</h4>
                  <div className="flex flex-col gap-4">
                    {[
                      { id: 'fase_a', label: 'Fase A', req: true },
                      { id: 'fase_b', label: 'Fase B', req: true },
                      { id: 'fase_c', label: 'Fase C', req: true },
                      { id: 'reserva', label: 'Reserva', req: false },
                    ].map((r) => {
                      const v1 = form.watch(`dados_detalhados.${r.id}.v1` as any)
                      const v2 = form.watch(`dados_detalhados.${r.id}.v2` as any)
                      const res = (Number(v1) || 0) * (Number(v2) || 0)
                      const hasValues =
                        v1 !== undefined && v2 !== undefined && v1 !== '' && v2 !== ''

                      return (
                        <div key={r.id} className="space-y-2">
                          <FormLabel className="text-xs font-semibold">
                            {r.label} {r.req && <span className="text-destructive">*</span>}
                          </FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                            <FormField
                              control={form.control}
                              name={`dados_detalhados.${r.id}.v1` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="any"
                                      placeholder={
                                        !r.req
                                          ? 'Preencher apenas se houver condutor reserva'
                                          : 'Valor 1'
                                      }
                                      className="h-8 text-xs"
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === '' ? '' : Number(e.target.value),
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`dados_detalhados.${r.id}.v2` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="any"
                                      placeholder="Valor 2"
                                      className="h-8 text-xs"
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === '' ? '' : Number(e.target.value),
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <div className="h-8 flex items-center px-3 border rounded-md bg-background text-xs text-muted-foreground whitespace-nowrap">
                              {hasValues
                                ? `${new Intl.NumberFormat('pt-BR').format(res)}`
                                : 'Resultado'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : equipmentType === 'Transformador de Potencial' ||
                equipmentType === 'Transformador de Corrente' ? (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <h4 className="text-sm font-medium">Medições de Isolamento</h4>
                  <div className="flex flex-col gap-4">
                    {[
                      { id: 'A', label: 'Fase A' },
                      { id: 'B', label: 'Fase B' },
                      { id: 'C', label: 'Fase C' },
                    ].map((r) => {
                      const v1 = form.watch(`dados_detalhados.fases.${r.id}.valor1` as any)
                      const v2 = form.watch(`dados_detalhados.fases.${r.id}.valor2` as any)
                      const res = (Number(v1) || 0) * (Number(v2) || 0)
                      const hasValues =
                        v1 !== undefined && v2 !== undefined && v1 !== '' && v2 !== ''

                      return (
                        <div key={r.id} className="space-y-2">
                          <FormLabel className="text-xs font-semibold">
                            {r.label} <span className="text-destructive">*</span>
                          </FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                            <FormField
                              control={form.control}
                              name={`dados_detalhados.fases.${r.id}.valor1` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="any"
                                      placeholder="Valor 1"
                                      className="h-8 text-xs"
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === '' ? '' : Number(e.target.value),
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`dados_detalhados.fases.${r.id}.valor2` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="any"
                                      placeholder="Valor 2"
                                      className="h-8 text-xs"
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === '' ? '' : Number(e.target.value),
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <div className="h-8 flex items-center px-3 border rounded-md bg-background text-xs text-muted-foreground whitespace-nowrap">
                              {hasValues
                                ? `${new Intl.NumberFormat('pt-BR').format(res)}`
                                : 'Resultado'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : equipmentType === 'Disjuntor' ? (
                <div className="space-y-6 border rounded-md p-4 bg-muted/20">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-primary border-b pb-2">
                      Disjuntor Ligado / Fechado
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px] p-2">Medição</TableHead>
                          <TableHead className="p-2">
                            Valor 1 <span className="text-destructive">*</span>
                          </TableHead>
                          <TableHead className="p-2">
                            Valor 2 <span className="text-destructive">*</span>
                          </TableHead>
                          <TableHead className="text-right p-2">Resultado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disjuntorFechadoRows.map((r) => {
                          const v1 = form.watch(`dados_detalhados.fechado.${r.id}.v1` as any)
                          const v2 = form.watch(`dados_detalhados.fechado.${r.id}.v2` as any)
                          const res = (Number(v1) || 0) * (Number(v2) || 0)

                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium text-xs p-2">{r.label}</TableCell>
                              <TableCell className="p-2 align-top">
                                <FormField
                                  control={form.control}
                                  name={`dados_detalhados.fechado.${r.id}.v1` as any}
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="any"
                                          className="h-8 text-xs"
                                          value={field.value ?? ''}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value === '' ? '' : Number(e.target.value),
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage className="text-[10px]" />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="p-2 align-top">
                                <FormField
                                  control={form.control}
                                  name={`dados_detalhados.fechado.${r.id}.v2` as any}
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="any"
                                          className="h-8 text-xs"
                                          value={field.value ?? ''}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value === '' ? '' : Number(e.target.value),
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage className="text-[10px]" />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right p-2 text-xs font-medium text-muted-foreground pt-4 whitespace-nowrap">
                                {v1 !== undefined && v2 !== undefined && v1 !== '' && v2 !== ''
                                  ? `${new Intl.NumberFormat('pt-BR').format(res)}`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-primary border-b pb-2">
                      Disjuntor Desligado / Aberto
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px] p-2">Medição</TableHead>
                          <TableHead className="p-2">
                            Valor 1 <span className="text-destructive">*</span>
                          </TableHead>
                          <TableHead className="p-2">
                            Valor 2 <span className="text-destructive">*</span>
                          </TableHead>
                          <TableHead className="text-right p-2">Resultado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disjuntorAbertoRows.map((r) => {
                          const v1 = form.watch(`dados_detalhados.aberto.${r.id}.v1` as any)
                          const v2 = form.watch(`dados_detalhados.aberto.${r.id}.v2` as any)
                          const res = (Number(v1) || 0) * (Number(v2) || 0)

                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium text-xs p-2">{r.label}</TableCell>
                              <TableCell className="p-2 align-top">
                                <FormField
                                  control={form.control}
                                  name={`dados_detalhados.aberto.${r.id}.v1` as any}
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="any"
                                          className="h-8 text-xs"
                                          value={field.value ?? ''}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value === '' ? '' : Number(e.target.value),
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage className="text-[10px]" />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="p-2 align-top">
                                <FormField
                                  control={form.control}
                                  name={`dados_detalhados.aberto.${r.id}.v2` as any}
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="any"
                                          className="h-8 text-xs"
                                          value={field.value ?? ''}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value === '' ? '' : Number(e.target.value),
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage className="text-[10px]" />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right p-2 text-xs font-medium text-muted-foreground pt-4 whitespace-nowrap">
                                {v1 !== undefined && v2 !== undefined && v1 !== '' && v2 !== ''
                                  ? `${new Intl.NumberFormat('pt-BR').format(res)}`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <Table>
                    {' '}
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] p-2">Medição</TableHead>
                        <TableHead className="p-2">
                          Valor 1 <span className="text-destructive">*</span>
                        </TableHead>
                        <TableHead className="p-2">
                          Valor 2 <span className="text-destructive">*</span>
                        </TableHead>
                        <TableHead className="text-right p-2">Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isoRows.map((r) => {
                        const v1 = form.watch(`dados_detalhados.${r.id}.v1` as any)
                        const v2 = form.watch(`dados_detalhados.${r.id}.v2` as any)
                        const res = (Number(v1) || 0) * (Number(v2) || 0)

                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium text-xs p-2">{r.label}</TableCell>
                            <TableCell className="p-2 align-top">
                              <FormField
                                control={form.control}
                                name={`dados_detalhados.${r.id}.v1` as any}
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        className="h-8 text-xs"
                                        value={field.value ?? ''}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value === '' ? '' : Number(e.target.value),
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="p-2 align-top">
                              <FormField
                                control={form.control}
                                name={`dados_detalhados.${r.id}.v2` as any}
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="any"
                                        className="h-8 text-xs"
                                        value={field.value ?? ''}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value === '' ? '' : Number(e.target.value),
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-right p-2 text-xs font-medium text-muted-foreground pt-4 whitespace-nowrap">
                              {v1 !== undefined && v2 !== undefined && v1 !== '' && v2 !== ''
                                ? `${new Intl.NumberFormat('pt-BR').format(res)}`
                                : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}

            {watchTipo === 'Resistências dos Isolamentos' && equipmentType === 'Transformador' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20 mt-4">
                <FormField
                  control={form.control}
                  name="dados_detalhados.temperatura"
                  render={({ field }) => (
                    <FormItem className="max-w-[300px]">
                      <FormLabel className="text-xs">
                        {meioIsolante === 'Epóxi'
                          ? 'Temperatura do Enrolamento (°C)'
                          : 'Temperatura do Óleo (°C)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          className="h-8 text-xs"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {watchTipo !== 'Resistências dos Contatos' &&
                watchTipo !== 'Resistências dos Isolamentos' &&
                watchTipo !== 'Resistências dos Enrolamentos' &&
                !(watchTipo === 'Relação de Tensões' && equipmentType === 'Transformador') && (
                  <FormField
                    control={form.control}
                    name="valor_teste"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Valor <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value ?? ''}
                            readOnly={watchTipo === 'Relação de Tensões'}
                            className={
                              watchTipo === 'Relação de Tensões'
                                ? 'bg-muted cursor-not-allowed'
                                : ''
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              {watchTipo !== 'Resistências dos Enrolamentos' && (
                <FormField
                  control={form.control}
                  name="unidade"
                  render={({ field }) => (
                    <FormItem
                      className={
                        watchTipo === 'Resistências dos Contatos' ||
                        watchTipo === 'Resistências dos Isolamentos' ||
                        (watchTipo === 'Relação de Tensões' && equipmentType === 'Transformador')
                          ? 'col-span-2'
                          : ''
                      }
                    >
                      <FormLabel>
                        Unidade <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: MΩ, V"
                          {...field}
                          value={field.value ?? ''}
                          readOnly={
                            watchTipo === 'Resistências dos Contatos' ||
                            watchTipo === 'Resistências dos Isolamentos' ||
                            watchTipo === 'Relação de Tensões'
                          }
                          className={
                            watchTipo === 'Resistências dos Contatos' ||
                            watchTipo === 'Resistências dos Isolamentos' ||
                            watchTipo === 'Relação de Tensões'
                              ? 'bg-muted cursor-not-allowed'
                              : ''
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="data_teste"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Data do Teste <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações adicionais sobre o teste..."
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Teste</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
