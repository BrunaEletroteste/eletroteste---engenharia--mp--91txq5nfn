import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Loader2, ShieldCheck, Activity } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
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
              : 'Verifique seu e-mail e senha e tente novamente.',
        variant: 'destructive',
      })
    } else {
      navigate('/')
    }
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
              Sistemas de Energia <br />
              <span className="text-amber-400">Inteligentes</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-md">
              Acesso restrito ao painel de gerenciamento de relatórios e manutenção preventiva de
              cabines primárias.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                Conexão Segura
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Activity className="h-5 w-5 text-amber-400" />
                Monitoramento 24/7
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 animate-fade-in">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2">
            <div className="lg:hidden flex items-center gap-2 text-amber-500 mb-6">
              <Zap className="h-8 w-8" fill="currentColor" />
              <span className="text-3xl font-bold tracking-tight text-slate-900">Eletroteste</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Acesse sua conta</h2>
            <p className="text-slate-500">Insira suas credenciais para continuar no sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                E-mail Corporativo
              </Label>
              <Input
                id="email"
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
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Senha
                </Label>
              </div>
              <Input
                id="password"
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
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Eletroteste Engenharia. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}
