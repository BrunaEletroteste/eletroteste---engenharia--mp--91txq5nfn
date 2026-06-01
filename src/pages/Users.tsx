import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Users as UsersIcon } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  tipo_acesso: z.string().min(1, 'Selecione um perfil'),
})

type FormData = z.infer<typeof formSchema>

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '', tipo_acesso: '' },
  })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await pb.collection('users').getFullList({ sort: '-created' })
      setUsers(res)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await pb.collection('users').update(id, { ativo: !current })
      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' })
      loadUsers()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const changeRole = async (id: string, newRole: string) => {
    try {
      await pb.collection('users').update(id, { tipo_acesso: newRole })
      toast({ title: 'Sucesso', description: 'Perfil atualizado.' })
      loadUsers()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar perfil', variant: 'destructive' })
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      await pb.collection('users').create({
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        tipo_acesso: data.tipo_acesso,
        ativo: true,
      })
      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso.' })
      setOpen(false)
      reset()
      loadUsers()
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o usuário',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" />
            Gestão de Usuários
          </CardTitle>
          <Dialog
            open={open}
            onOpenChange={(val) => {
              setOpen(val)
              if (!val) reset()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input {...register('name')} placeholder="Digite o nome" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...register('email')} type="email" placeholder="usuario@email.com" />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select onValueChange={(val) => setValue('tipo_acesso', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="tecnico_campo">Técnico de Campo</SelectItem>
                      <SelectItem value="revisor_interno">Revisor Interno</SelectItem>
                      <SelectItem value="visitante">Visitante</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo_acesso && (
                    <p className="text-xs text-red-500">{errors.tipo_acesso.message}</p>
                  )}
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-center">Status (Ativo)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.tipo_acesso}
                          onValueChange={(val) => changeRole(u.id, val)}
                        >
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="tecnico_campo">Técnico de Campo</SelectItem>
                            <SelectItem value="revisor_interno">Revisor Interno</SelectItem>
                            <SelectItem value="visitante">Visitante</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={u.ativo}
                            onCheckedChange={() => toggleActive(u.id, u.ativo)}
                          />
                          {u.ativo ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-800">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
