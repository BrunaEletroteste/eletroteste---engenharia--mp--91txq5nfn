import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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
import { TestItem } from '@/types/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const testSchema = z.object({
  tipo_teste: z.enum(
    [
      'Resistências dos Isolamentos',
      'Relação de Tensões',
      'Resistências dos Enrolamentos',
      'Resistências dos Contatos',
    ],
    {
      required_error: 'Selecione o tipo de teste',
    },
  ),
  valor_teste: z.coerce.number().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  data_teste: z.string().min(1, 'Data é obrigatória'),
  dados_detalhados: z.any().optional(),
  observacoes: z.string().optional(),
})

type TestFormValues = z.infer<typeof testSchema>

interface TestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (test: TestItem) => void
  initialData?: TestItem
}

const isoRows = [
  { id: 'ab', label: 'A x B' },
  { id: 'bc', label: 'B x C' },
  { id: 'ac', label: 'A x C' },
  { id: 'abc_massa', label: 'A, B, C x Massa' },
]

export function TestModal({ open, onOpenChange, onSave, initialData }: TestModalProps) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
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
          valor_teste: initialData.valor_teste,
          unidade: initialData.unidade,
          data_teste: initialData.data_teste,
          dados_detalhados: initialData.dados_detalhados || {},
          observacoes: initialData.observacoes || '',
        })
      } else {
        form.reset({
          tipo_teste: undefined as any,
          valor_teste: 0,
          unidade: '',
          data_teste: new Date().toISOString().split('T')[0],
          dados_detalhados: {},
          observacoes: '',
        })
      }
    }
  }, [open, initialData, form])

  useEffect(() => {
    if (!open) return
    if (watchTipo === 'Resistências dos Contatos') {
      form.setValue('unidade', 'Micro-Ohm')
      form.setValue('valor_teste', 0)
    } else if (watchTipo === 'Resistências dos Isolamentos') {
      form.setValue('unidade', 'Mega-Ohms')
      form.setValue('valor_teste', 0)
    }
  }, [watchTipo, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Teste' : 'Adicionar Teste'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              onSave({ ...data, valor_teste: data.valor_teste || 0 } as TestItem),
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="tipo_teste"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Teste</FormLabel>
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

            {watchTipo === 'Resistências dos Contatos' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="text-sm font-medium">Medições das Fases</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dados_detalhados.fase_a"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fase A</FormLabel>
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
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.fase_b"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fase B</FormLabel>
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
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dados_detalhados.fase_c"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fase C</FormLabel>
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
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {watchTipo === 'Resistências dos Isolamentos' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] p-2">Medição</TableHead>
                      <TableHead className="p-2">Valor 1</TableHead>
                      <TableHead className="p-2">Valor 2</TableHead>
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
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="any"
                              className="h-8 text-xs"
                              value={v1 ?? ''}
                              onChange={(e) =>
                                form.setValue(
                                  `dados_detalhados.${r.id}.v1` as any,
                                  e.target.value === '' ? '' : Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="any"
                              className="h-8 text-xs"
                              value={v2 ?? ''}
                              onChange={(e) =>
                                form.setValue(
                                  `dados_detalhados.${r.id}.v2` as any,
                                  e.target.value === '' ? '' : Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right p-2 text-xs font-medium text-muted-foreground">
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
            )}

            <div className="grid grid-cols-2 gap-4">
              {watchTipo !== 'Resistências dos Contatos' &&
                watchTipo !== 'Resistências dos Isolamentos' && (
                  <FormField
                    control={form.control}
                    name="valor_teste"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
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
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: MΩ, V"
                        {...field}
                        readOnly={
                          watchTipo === 'Resistências dos Contatos' ||
                          watchTipo === 'Resistências dos Isolamentos'
                        }
                        className={
                          watchTipo === 'Resistências dos Contatos' ||
                          watchTipo === 'Resistências dos Isolamentos'
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
                  <FormLabel>Data do Teste</FormLabel>
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
