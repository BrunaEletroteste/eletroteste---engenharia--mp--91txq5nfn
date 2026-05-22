import pb from '@/lib/pocketbase/client'

export interface OpcaoPadronizada {
  id: string
  categoria: string
  valor: string
  created: string
  updated: string
}

export const getOpcoesPadronizadas = (categoria?: string) => {
  const filter = categoria ? `categoria = '${categoria}'` : ''
  return pb.collection('opcoes_padronizadas').getFullList<OpcaoPadronizada>({
    filter,
    sort: 'categoria,valor',
  })
}

export const createOpcao = (data: { categoria: string; valor: string }) =>
  pb.collection('opcoes_padronizadas').create(data)

export const deleteOpcao = (id: string) => pb.collection('opcoes_padronizadas').delete(id)
