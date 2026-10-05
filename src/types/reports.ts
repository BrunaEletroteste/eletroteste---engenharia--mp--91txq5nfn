import { z } from 'zod'

export const reportFormSchema = z.object({
  numero_relatorio: z.string().min(1, 'Número do relatório é obrigatório'),
  numero_proposta: z.string().optional(),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  obra: z.string().optional(),
  data_execucao: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  responsavel_tecnico: z.string().optional(),
  aprovador_relatorio: z.string().optional(),
  acompanhante: z.string().optional(),
  proxima_manutencao: z.string().optional(),
  status: z.enum(['rascunho', 'finalizado']),
  observacoes: z.string().optional(),
  tipo_laudo: z.enum(['PREVENTIVA', 'PREVENTIVA_CORRETIVA']).optional().default('PREVENTIVA'),
})

export type FormValues = z.infer<typeof reportFormSchema>

export const TEST_TYPES_ORDER = [
  'Resistências dos Isolamentos',
  'Resistências dos Enrolamentos',
  'Relação de Tensões',
] as const

export const getTestTypeOrderIndex = (tipoTeste: string): number => {
  const index = (TEST_TYPES_ORDER as readonly string[]).indexOf(tipoTeste)
  return index === -1 ? 999 : index
}

export const sortTestTypes = (types: string[]): string[] => {
  return [...types].sort((a, b) => {
    const orderA = getTestTypeOrderIndex(a)
    const orderB = getTestTypeOrderIndex(b)
    if (orderA !== orderB) return orderA - orderB
    return a.localeCompare(b, 'pt-BR')
  })
}

export const sortTestsList = <T extends { tipo_teste?: string; data_teste?: string }>(
  tests: T[],
): T[] => {
  return [...tests].sort((a, b) => {
    const orderA = getTestTypeOrderIndex(a.tipo_teste || '')
    const orderB = getTestTypeOrderIndex(b.tipo_teste || '')
    if (orderA !== orderB) return orderA - orderB
    const dateA = a.data_teste ? new Date(a.data_teste).getTime() : 0
    const dateB = b.data_teste ? new Date(b.data_teste).getTime() : 0
    return dateA - dateB
  })
}

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
  _dirty?: boolean
  _isNew?: boolean
}

export type ParecerItem = {
  id?: string
  parecer?: string
  parecer_anterior?: string
  justificativa_mudanca?: string
  observacoes?: string
  observacoes_anteriores?: string
  _dirty?: boolean
  _isNew?: boolean
  _delete?: boolean
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
  _dirty?: boolean
  _isNew?: boolean
}
