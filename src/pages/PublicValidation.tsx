import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { XCircle, Loader2, ShieldCheck, Calendar, Building2, User, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import logoImg from '@/assets/logotransparente-c06b6.png'

export default function PublicValidation() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setError(true)
        setLoading(false)
        return
      }
      try {
        const res = await pb.send(`/backend/v1/validar-relatorio/${id}`, { method: 'GET' })
        setData(res)
      } catch (e) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-900" />
          <p className="text-slate-600 font-medium">Verificando autenticidade...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-red-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Documento Não Encontrado
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Não foi possível validar este relatório. O link pode ser inválido ou o documento foi
              removido.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <img src={logoImg} alt="Eletroteste" className="h-12 opacity-50 object-contain" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isFinalizado = data.status === 'finalizado'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100 blur-[100px] pointer-events-none" />

      <Card
        className={`w-full max-w-lg shadow-xl relative z-10 border-t-4 ${isFinalizado ? 'border-t-green-500' : 'border-t-amber-500'}`}
      >
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <img src={logoImg} alt="Eletroteste" className="h-16 object-contain" />
          </div>
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isFinalizado ? 'bg-green-100' : 'bg-amber-100'}`}
          >
            {isFinalizado ? (
              <ShieldCheck className={`h-8 w-8 text-green-600`} />
            ) : (
              <ShieldCheck className={`h-8 w-8 text-amber-600`} />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {isFinalizado ? 'Documento Autêntico' : 'Documento em Rascunho'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Este relatório foi emitido pela Eletroteste Engenharia.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-lg space-y-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-blue-900 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-500">Nº do Relatório</p>
                <p className="text-base font-semibold text-slate-900">{data.numero_relatorio}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-900 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-500">Cliente</p>
                <p className="text-base font-semibold text-slate-900">
                  {data.cliente?.nome_empresa}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">CNPJ: {data.cliente?.cnpj}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-900 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-500">Data de Execução</p>
                <p className="text-base font-medium text-slate-900">
                  {formatDate(data.data_execucao)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-900 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-500">Responsável Técnico</p>
                <p className="text-base font-medium text-slate-900">
                  {data.responsavel_tecnico || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2 pb-6 text-center">
          <p className="text-xs text-slate-500 px-4">
            Qualquer alteração física ou digital neste documento que não conste neste registro o
            invalidará.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
