import { z } from 'zod'

export const reportFormSchema = z.object({
  numero_relatorio: z.string().min(1, 'Número do relatório é obrigatório'),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  data_execucao: z.string().min(1, 'Data de execução é obrigatória'),
  acompanhante: z.string().optional(),
  proxima_manutencao: z.string().optional(),
  status: z.enum(['rascunho', 'finalizado']),
  observacoes: z.string().optional(),
})

export type FormValues = z.infer<typeof reportFormSchema>

export type TestItem = {
  id?: string
  tipo_teste: string
  valor_teste: number
  unidade: string
  data_teste: string
  _delete?: boolean
}

export type EquipmentItem = {
  id?: string
  tipo_equipamento: string
  dados_tecnicos: Record<string, any>
  testes?: TestItem[]
  _delete?: boolean
}
