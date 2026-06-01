import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
})

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Senha atual é obrigatória'),
    password: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres'),
    passwordConfirm: z.string().min(8, 'A confirmação de senha deve ter no mínimo 8 caracteres'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })

export default function Profile() {
  const { user } = useAuth()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      password: '',
      passwordConfirm: '',
    },
  })

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(pb.files.getURL(user, user.avatar))
    } else {
      setAvatarPreview(`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`)
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const updatedUser = await pb.collection('users').update(user.id, formData)

      // Manually refresh authStore state so Header Avatar syncs instantly
      pb.authStore.save(pb.authStore.token, updatedUser)

      toast.success('Perfil atualizado com sucesso!')

      if (avatarFile) {
        setAvatarPreview(pb.files.getURL(updatedUser, updatedUser.avatar))
        setAvatarFile(null)
      }
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          profileForm.setError(field as any, { type: 'manual', message: msg })
        })
      } else {
        toast.error('Erro ao atualizar perfil. Tente novamente mais tarde.')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user) return
    setIsSavingPassword(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword: data.oldPassword,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      })

      // Token is invalidated after a password change, we must re-authenticate
      await pb.collection('users').authWithPassword(user.email, data.password)

      toast.success('Senha atualizada com sucesso!')
      passwordForm.reset()
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          passwordForm.setError(field as any, { type: 'manual', message: msg })
        })
      } else {
        toast.error('Erro ao atualizar senha. Verifique sua senha atual e tente novamente.')
      }
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e credenciais de segurança.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seu nome e foto de perfil visível no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-col items-center mb-6 space-y-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-primary/10">
                  <AvatarImage src={avatarPreview || ''} className="object-cover" />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">Alterar</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  Acesso: {user?.tipo_acesso?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <Form {...profileForm}>
              <form
                id="profile-form"
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-end border-t bg-muted/20 pt-6">
            <Button form="profile-form" type="submit" disabled={isSavingProfile}>
              {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Perfil
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Altere sua senha de acesso ao sistema.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Form {...passwordForm}>
              <form
                id="password-form"
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-end border-t bg-muted/20 pt-6">
            <Button
              form="password-form"
              type="submit"
              variant="default"
              disabled={isSavingPassword}
            >
              {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Senha
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
