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

    if (
      data.tipo_teste !== 'Resistências dos Contatos' &&
      data.tipo_teste !== 'Resistências dos Isolamentos'
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
}

const isoRows = [
  { id: 'ab', label: 'A x B' },
  { id: 'bc', label: 'B x C' },
  { id: 'ac', label: 'A x C' },
  { id: 'abc_massa', label: 'A, B, C x Massa' },
]

const CATEGORY_MAP: Record<string, string> = {
  'Resistências dos Isolamentos': 'equipamento_isolamento',
  'Relação de Tensões': 'equipamento_relacao',
  'Resistências dos Enrolamentos': 'equipamento_enrolamento',
  'Resistências dos Contatos': 'equipamento_contatos',
}

export function TestModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  equipmentType,
}: TestModalProps) {
  const [equipmentOptions, setEquipmentOptions] = useState<OpcaoPadronizada[]>([])

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
      form.setValue('unidade', 'V/V', { shouldValidate: true })
    }
  }, [watchTipo, form, open])

  const tp = form.watch('dados_detalhados.tensao_primaria')
  const ts = form.watch('dados_detalhados.tensao_secundaria')

  useEffect(() => {
    if (watchTipo === 'Relação de Tensões' && open) {
      const prim = Number(tp)
      const sec = Number(ts)
      if (!isNaN(prim) && !isNaN(sec) && sec !== 0) {
        form.setValue('valor_teste', Number((prim / sec).toFixed(4)), { shouldValidate: true })
      } else {
        form.setValue('valor_teste', 0, { shouldValidate: true })
      }
    }
  }, [tp, ts, watchTipo, form, open])

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
                phases.forEach((p) => {
                  if (payload.dados_detalhados[p]) {
                    const v1 = Number(payload.dados_detalhados[p].v1) || 0
                    const v2 = Number(payload.dados_detalhados[p].v2) || 0
                    payload.dados_detalhados[p].resultado = v1 * v2
                  }
                })
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
                      <SelectItem value="Relação de Tensões">Relação de Tensões</SelectItem>
                      <SelectItem value="Resistências dos Enrolamentos">
                        Resistências dos Enrolamentos
                      </SelectItem>
                      <SelectItem value="Resistências dos Contatos">
                        Resistências dos Contatos
                      </SelectItem>
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

            {watchTipo === 'Relação de Tensões' && (
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
                            <div className="h-8 flex items-center px-3 border rounded-md bg-background text-xs text-muted-foreground">
                              {hasValues ? res : 'Resultado'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
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
                            <TableCell className="text-right p-2 text-xs font-medium text-muted-foreground pt-4">
                              {v1 !== undefined && v2 !== undefined && v1 !== '' && v2 !== ''
                                ? res
                                : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}

            <div className="grid grid-cols-2 gap-4">
              {watchTipo !== 'Resistências dos Contatos' &&
                watchTipo !== 'Resistências dos Isolamentos' && (
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
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem
                    className={
                      watchTipo === 'Resistências dos Contatos' ||
                      watchTipo === 'Resistências dos Isolamentos'
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
