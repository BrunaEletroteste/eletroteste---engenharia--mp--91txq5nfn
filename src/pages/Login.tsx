import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Loader2, ShieldCheck, Activity, ArrowRight } from 'lucide-react'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { signIn, signUp, isAuthenticated, loading: authLoading, error } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setFieldErrors({})
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro de Autenticação',
        description:
          (error as Error).message === 'Conta inativa'
            ? 'A conta está inativa.'
            : (error as Error).message === 'Visitante'
              ? 'O acesso ainda não foi liberado pelo administrador. Por favor, aguarde.'
              : 'Email ou senha incorretos.',
        variant: 'destructive',
      })
    } else {
      navigate('/')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As senhas não coincidem.' })
      return
    }

    if (password.length < 8) {
      setFieldErrors({ password: 'A senha deve ter no mínimo 8 caracteres.' })
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)

    if (error) {
      const extracted = extractFieldErrors(error)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        toast({
          title: 'Erro no Cadastro',
          description:
            'Não foi possível realizar o cadastro. Verifique os dados e tente novamente.',
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Aguarde a aprovação de um administrador para acessar.',
      })
      setIsRegistering(false)
      setPassword('')
      setConfirmPassword('')
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    setFieldErrors({})
    setPassword('')
    setConfirmPassword('')
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md shadow-sm border border-red-100">
          <h2 className="text-lg font-bold mb-2">Erro de Conexão</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/40 z-10" />
        <img
          src="https://img.usecurling.com/p/1000/1000?q=electrical%20substation%20power%20transformers&color=black"
          alt="Electrical Substation"
          className="absolute inset-0 h-full w-full object-cover z-0 mix-blend-overlay opacity-80"
        />

        <div className="relative z-20 flex flex-col justify-between p-12 h-full w-full">
          <div className="flex items-center gap-2 text-amber-400">
            <Zap className="h-8 w-8" fill="currentColor" />
            <span className="text-3xl font-bold tracking-tight text-white">Eletroteste</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl leading-tight">
              Gestão de Manutenção Preventiva <br />
              <span className="text-amber-400">Cabines Primárias</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-md">
              Plataforma dedicada para controle de relatórios, laudos e histórico de manutenção
              preventiva em cabines primárias e subestações.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                Confiabilidade
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Activity className="h-5 w-5 text-amber-400" />
                Segurança
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 animate-fade-in relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2">
            <div className="lg:hidden flex items-center gap-2 text-amber-500 mb-6">
              <Zap className="h-8 w-8" fill="currentColor" />
              <span className="text-3xl font-bold tracking-tight text-slate-900">Eletroteste</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {isRegistering ? 'Criar nova conta' : 'Acesse sua conta'}
            </h2>
            <p className="text-slate-500">
              {isRegistering
                ? 'Preencha os dados abaixo para solicitar acesso'
                : 'Insira suas credenciais para continuar no sistema'}
            </p>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-6 mt-8 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-700 font-medium">
                  E-mail Corporativo
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-slate-300 focus-visible:ring-amber-500 h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-slate-700 font-medium">
                    Senha
                  </Label>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-slate-300 focus-visible:ring-amber-500 h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-base transition-colors"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                >
                  Não tem uma conta? Cadastre-se <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5 mt-8 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-slate-700 font-medium">
                  Nome Completo
                </Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white border-slate-300 focus-visible:ring-amber-500 h-11"
                />
                {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-700 font-medium">
                  E-mail
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-slate-300 focus-visible:ring-amber-500 h-11"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">Este email já está em uso ou é inválido.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-700 font-medium">
                  Senha
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-white border-slate-300 focus-visible:ring-amber-500 h-11"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password" className="text-slate-700 font-medium">
                  Confirmar Senha
                </Label>
                <Input
                  id="reg-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-white border-slate-300 focus-visible:ring-amber-500 h-11"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-base transition-colors mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {loading ? 'Cadastrando...' : 'Solicitar Acesso'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                >
                  Já tenho uma conta. Entrar
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Eletroteste Engenharia. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}
