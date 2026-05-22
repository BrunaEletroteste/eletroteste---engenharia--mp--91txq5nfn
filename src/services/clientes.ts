import pb from '@/lib/pocketbase/client'

export interface Cliente {
  id: string
  cnpj: string
  nome_empresa: string
  endereco?: string
  telefone?: string
  email_contato?: string
  created: string
  updated: string
}

export const getClientes = () =>
  pb.collection<Cliente>('clientes').getFullList({ sort: '-created' })

export const createCliente = (data: Partial<Cliente>) =>
  pb.collection<Cliente>('clientes').create(data)

export const updateCliente = (id: string, data: Partial<Cliente>) =>
  pb.collection<Cliente>('clientes').update(id, data)

export const deleteCliente = (id: string) => pb.collection<Cliente>('clientes').delete(id)
