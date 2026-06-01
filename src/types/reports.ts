import { z } from 'zod'

export const reportFormSchema = z.object({
  numero_relatorio: z.string().min(1, 'Número do relatório é obrigatório'),
  numero_proposta: z.string().optional(),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  data_execucao: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  responsavel_tecnico: z.string().optional(),
  acompanhante: z.string().optional(),
  proxima_manutencao: z.string().optional(),
  status: z.enum(['rascunho', 'finalizado']),
  observacoes: z.string().optional(),
})

export type FormValues = z.infer<typeof reportFormSchema>

export type TestItem = {
  id?: string
  tipo_teste: string
  equipamento_utilizado: string
  valor_teste: number
  unidade: string
  data_teste: string
  dados_detalhados?: Record<string, any> | null
  observacoes?: string
  _delete?: boolean
}

export type ParecerItem = {
  id?: string
  parecer?: string
  parecer_anterior?: string
  justificativa_mudanca?: string
  observacoes?: string
}

export type EquipmentItem = {
  id?: string
  tipo_equipamento: string
  dados_tecnicos: Record<string, any>
  ordem?: number
  testes?: TestItem[]
  parecer?: ParecerItem
  fotos?: string[]
  _delete?: boolean
}
