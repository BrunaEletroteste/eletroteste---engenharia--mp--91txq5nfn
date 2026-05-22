import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { addYears, format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { FormValues } from '@/types/reports'
import { useAuth } from '@/hooks/use-auth'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'

export function ReportHeaderSection({ isView }: { isView: boolean }) {
  const { control, setValue } = useFormContext<FormValues>()
  const { user } = useAuth()
  const [clientes, setClientes] = useState<any[]>([])

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        if (user?.tipo_acesso === 'admin') {
          const res = await pb.collection('clientes').getFullList()
          setClientes(res)
        } else if (user?.cnpj_cliente) {
          const res = await pb
            .collection('clientes')
            .getFullList({ filter: `cnpj='${user.cnpj_cliente}'` })
          setClientes(res)
        }
      } catch (err) {
        console.error('Failed to load clients', err)
      }
    }
    fetchClientes()
  }, [user])

  const comboOptions = clientes.map((c) => ({
    label: `${c.nome_empresa} (${c.cnpj})`,
    value: c.id,
  }))

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b">
        <h3 className="text-lg font-semibold text-primary">1. Cabeçalho do Relatório</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="numero_relatorio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Número do Relatório <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isView}
                  placeholder="Ex: 001/2026"
                  className="font-medium"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Cliente <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                {isView ? (
                  <Input
                    disabled
                    value={clientes.find((c) => c.id === field.value)?.nome_empresa || ''}
                    className="bg-muted"
                  />
                ) : (
                  <Combobox
                    options={comboOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione um cliente"
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="data_execucao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Data de Execução <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  disabled={isView}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    if (e.target.value && !isView) {
                      const nextYear = addYears(new Date(e.target.value), 1)
                      setValue('proxima_manutencao', format(nextYear, 'yyyy-MM-dd'), {
                        shouldValidate: true,
                      })
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="acompanhante"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acompanhante</FormLabel>
              <FormControl>
                <Input {...field} disabled={isView} placeholder="Nome do acompanhante do cliente" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="proxima_manutencao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Próxima Manutenção</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={isView} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="observacoes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações Gerais</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                disabled={isView}
                className="min-h-[120px] resize-y"
                placeholder="Descreva observações gerais ou resumo do serviço..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
