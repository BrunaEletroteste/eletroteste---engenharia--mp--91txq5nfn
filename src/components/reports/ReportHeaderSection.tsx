import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useParams, Link } from 'react-router-dom'
import { addYears, format } from 'date-fns'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { FormValues } from '@/types/reports'
import { useAuth } from '@/hooks/use-auth'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ReportHeaderSection({ isView }: { isView: boolean }) {
  const { control, setValue, getValues } = useFormContext<FormValues>()
  const { user } = useAuth()
  const { id } = useParams()
  const [clientes, setClientes] = useState<any[]>([])

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        if (user?.tipo_acesso === 'admin' || user?.tipo_acesso === 'revisor_interno') {
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
      <div className="pb-2 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary">1. Cabeçalho do Relatório</h3>
        {isView && id && (
          <Button variant="outline" size="sm" asChild className="print:hidden">
            <Link to={`/relatorio/preview/${id}`}>
              <Printer className="h-4 w-4 mr-2" />
              Visualizar Impressão
            </Link>
          </Button>
        )}
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
          name="numero_proposta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Proposta</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isView}
                  placeholder="Ex: PROP-001/2026"
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
          render={({ field }) => {
            const selectedClient = clientes.find((c) => c.id === field.value)
            const clientName = selectedClient
              ? `${selectedClient.nome_empresa} (${selectedClient.cnpj})`
              : ''
            return (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Cliente <span className="text-destructive">*</span>
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full overflow-hidden">
                      <FormControl>
                        {isView ? (
                          <Input
                            disabled
                            value={selectedClient?.nome_empresa || ''}
                            className="bg-muted truncate w-full"
                          />
                        ) : (
                          <div className="w-full overflow-hidden *:max-w-full [&_button]:truncate">
                            <Combobox
                              options={comboOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione um cliente"
                            />
                          </div>
                        )}
                      </FormControl>
                    </div>
                  </TooltipTrigger>
                  {clientName && <TooltipContent>{clientName}</TooltipContent>}
                </Tooltip>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormField
          control={control}
          name="tipo_laudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tipo de Laudo <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                disabled={isView}
                onValueChange={field.onChange}
                value={field.value || 'PREVENTIVA'}
              >
                <FormControl>
                  <SelectTrigger className="font-medium text-left">
                    <SelectValue placeholder="Selecione o tipo de laudo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PREVENTIVA">
                    LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA EM CABINE(S) PRIMÁRIA(S)
                  </SelectItem>
                  <SelectItem value="PREVENTIVA_CORRETIVA">
                    LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA E CORRETIVA EM CABINE(S) PRIMÁRIA(S)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="obra"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Obra</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isView}
                  placeholder="Identificação da obra (opcional)"
                  className="font-medium"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="data_execucao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Data de Início <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={isView}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      if (!isView) {
                        const start = e.target.value
                        const end = getValues('data_fim')
                        const baseDateStr = end || start
                        if (baseDateStr) {
                          const nextYear = addYears(new Date(`${baseDateStr}T12:00:00`), 1)
                          setValue('proxima_manutencao', format(nextYear, 'yyyy-MM-dd'), {
                            shouldValidate: true,
                          })
                        }
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
            name="data_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Término</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={isView}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e)
                      if (!isView) {
                        const start = getValues('data_execucao')
                        const end = e.target.value
                        const baseDateStr = end || start
                        if (baseDateStr) {
                          const nextYear = addYears(new Date(`${baseDateStr}T12:00:00`), 1)
                          setValue('proxima_manutencao', format(nextYear, 'yyyy-MM-dd'), {
                            shouldValidate: true,
                          })
                        }
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="responsavel_tecnico"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Executor Responsável</FormLabel>
              <FormControl>
                <Input {...field} disabled={isView} placeholder="Nome do executor responsável" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="aprovador_relatorio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aprovador do Relatório</FormLabel>
              <FormControl>
                <Input {...field} disabled={isView} placeholder="Nome do aprovador do relatório" />
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
