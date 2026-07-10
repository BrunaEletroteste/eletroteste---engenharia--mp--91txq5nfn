import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  type Cliente,
} from '@/services/clientes'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  nome_empresa: z.string().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório'),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  email_contato: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
})

type ClientFormValues = z.infer<typeof schema>

export default function Clientes() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Cliente | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome_empresa: '', cnpj: '', endereco: '', telefone: '', email_contato: '' },
  })

  const load = async () => {
    try {
      setData(await getClientes())
    } catch {
      toast({ title: 'Erro ao carregar clientes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('clientes', load)

  const filtered = useMemo(
    () =>
      data.filter(
        (c) =>
          c.nome_empresa.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search),
      ),
    [data, search],
  )

  const onSubmit = async (vals: ClientFormValues) => {
    try {
      if (editItem) {
        await updateCliente(editItem.id, vals)
        toast({ title: 'Dados atualizados!' })
      } else {
        await createCliente(vals)
        toast({ title: 'Cliente cadastrado com sucesso!' })
      }
      setDialogOpen(false)
    } catch (e) {
      const errs = extractFieldErrors(e)
      if (Object.keys(errs).length) {
        Object.entries(errs).forEach(([k, v]) => form.setError(k as any, { message: v }))
      } else {
        toast({ title: 'Erro ao salvar cliente', variant: 'destructive' })
      }
    }
  }

  const onDel = async () => {
    if (!deleteId) return
    try {
      await deleteCliente(deleteId)
      toast({ title: 'Cliente excluído!' })
    } catch {
      toast({ title: 'Erro ao excluir cliente', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const handleOpenDialog = (c?: Cliente) => {
    setEditItem(c || null)
    form.reset(
      c
        ? {
            nome_empresa: c.nome_empresa,
            cnpj: c.cnpj,
            endereco: c.endereco || '',
            telefone: c.telefone || '',
            email_contato: c.email_contato || '',
          }
        : { nome_empresa: '', cnpj: '', endereco: '', telefone: '', email_contato: '' },
    )
    setDialogOpen(true)
  }

  const canManage = user?.tipo_acesso === 'admin' || user?.tipo_acesso === 'revisor_interno'

  if (!canManage) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito a administradores e revisores.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gerencie as empresas cadastradas no sistema.</p>
        </div>
        {canManage && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="border rounded-md bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail de Contato</TableHead>
              {canManage && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  <Skeleton className="h-6 w-48 mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Building2 className="h-10 w-10 mb-3 opacity-20" />
                    <p>Nenhum cliente encontrado</p>
                    {canManage && (
                      <Button variant="link" onClick={() => handleOpenDialog()}>
                        Adicionar o primeiro
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome_empresa}</TableCell>
                  <TableCell>{c.cnpj}</TableCell>
                  <TableCell>{c.telefone}</TableCell>
                  <TableCell>{c.email_contato}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-destructive hover:bg-destructive/10 text-muted-foreground"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome_empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email_contato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de Contato</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e pode
              afetar os relatórios associados a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDel}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
