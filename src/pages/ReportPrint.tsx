import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'

export default function ReportPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        const report = await pb.collection('relatorios').getOne(id, {
          expand: 'cliente_id,criado_por',
        })
        const equipments = await pb.collection('equipamentos_relatorio').getFullList({
          filter: `relatorio_id='${id}'`,
          sort: 'ordem',
        })
        const testes = await pb.collection('testes_equipamento').getFullList({
          filter: `equipamento_id.relatorio_id='${id}'`,
        })
        const pareceres = await pb.collection('parecer_tecnico').getFullList({
          filter: `equipamento_id.relatorio_id='${id}'`,
        })

        const eqData = equipments.map((eq) => ({
          ...eq,
          testes: testes.filter((t) => t.equipamento_id === eq.id),
          parecer: pareceres.find((p) => p.equipamento_id === eq.id),
        }))

        setData({ report, equipments: eqData })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
        setTimeout(() => {
          window.print()
        }, 800)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-black">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-3 font-medium">Preparando documento...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-black flex-col">
        <p className="text-xl font-semibold mb-4">Erro ao carregar relatório.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  const { report, equipments } = data
  const cliente = report.expand?.cliente_id || {}
  const autor = report.expand?.criado_por || {}

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const renderDetalhes = (detalhes: any) => {
    if (!detalhes) return null
    return Object.entries(detalhes).map(([k, v]) => {
      if (typeof v === 'object' && v !== null) {
        return (
          <div key={k} className="mb-1">
            <span className="font-semibold capitalize text-slate-700">{k.replace(/_/g, ' ')}:</span>
            <div className="ml-4 border-l-2 border-slate-200 pl-2 mt-1 space-y-1">
              {Object.entries(v).map(([sk, sv]) => (
                <div key={sk} className="text-slate-600">
                  <span className="font-medium capitalize">{sk.replace(/_/g, ' ')}:</span>{' '}
                  {String(sv)}
                </div>
              ))}
            </div>
          </div>
        )
      }
      return (
        <div key={k} className="text-slate-700">
          <span className="font-semibold capitalize">{k.replace(/_/g, ' ')}:</span> {String(v)}
        </div>
      )
    })
  }

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Action Bar - Hidden on print */}
      <div className="no-print bg-slate-100 p-4 flex justify-between items-center fixed top-0 w-full shadow-sm z-50 border-b">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Document Container */}
      <div className="pt-24 px-8 pb-8 max-w-[210mm] mx-auto text-sm print:pt-0 print:px-0 print:pb-0 font-sans">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4 avoid-break">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LAUDO TÉCNICO</h1>
            <h2 className="text-lg font-medium text-slate-600 mt-1 uppercase">
              Manutenção Preventiva - Cabine Primária
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex sm:justify-end items-center mb-1">
              <img
                src="https://img.usecurling.com/i?q=electricity&color=blue&shape=fill"
                alt="Logo"
                className="h-10 w-auto mr-2"
              />
              <span className="font-bold text-xl tracking-tight text-blue-900">ELETROTESTE</span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              Engenharia e Serviços
            </p>
          </div>
        </div>

        {/* Client and Report Info */}
        <div className="mb-8 avoid-break">
          <div className="bg-slate-800 text-white p-2 font-bold mb-3 uppercase text-xs tracking-wider">
            Dados do Cliente e Relatório
          </div>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold w-1/4 bg-slate-100 text-slate-700">
                  Empresa
                </td>
                <td className="border border-slate-300 p-2 w-3/4 font-medium">
                  {cliente.nome_empresa || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  CNPJ
                </td>
                <td className="border border-slate-300 p-2">{cliente.cnpj || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Endereço
                </td>
                <td className="border border-slate-300 p-2">{cliente.endereco || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Nº Relatório
                </td>
                <td className="border border-slate-300 p-2 font-bold text-blue-900">
                  {report.numero_relatorio}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Nº Proposta
                </td>
                <td className="border border-slate-300 p-2">{report.numero_proposta || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Execution Info */}
        <div className="mb-8 avoid-break">
          <div className="bg-slate-800 text-white p-2 font-bold mb-3 uppercase text-xs tracking-wider">
            Dados da Execução
          </div>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold w-1/4 bg-slate-100 text-slate-700">
                  Data Início
                </td>
                <td className="border border-slate-300 p-2 w-1/4">
                  {formatDate(report.data_execucao)}
                </td>
                <td className="border border-slate-300 p-2 font-semibold w-1/4 bg-slate-100 text-slate-700">
                  Data Fim
                </td>
                <td className="border border-slate-300 p-2 w-1/4">{formatDate(report.data_fim)}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Responsável Técnico
                </td>
                <td className="border border-slate-300 p-2 font-medium" colSpan={3}>
                  {autor.name || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Temp. Ambiente
                </td>
                <td className="border border-slate-300 p-2">
                  {report.temperatura_ambiente ? `${report.temperatura_ambiente} °C` : 'N/A'}
                </td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Umidade Relativa
                </td>
                <td className="border border-slate-300 p-2">
                  {report.umidade_relativa ? `${report.umidade_relativa} %` : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Equipments Body */}
        {equipments.map((eq: any, i: number) => (
          <div key={eq.id} className="mb-10 avoid-break border border-slate-400">
            <div className="bg-slate-200 text-slate-900 p-3 font-bold text-base border-b border-slate-400">
              {i + 1}. EQUIPAMENTO: {eq.tipo_equipamento.toUpperCase()}
            </div>

            <div className="p-4 space-y-6">
              {/* Technical Data */}
              {eq.dados_tecnicos && Object.keys(eq.dados_tecnicos).length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                    Características Técnicas
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(eq.dados_tecnicos).map(([k, v]) => (
                      <div key={k} className="flex text-sm border-b border-slate-100 pb-1">
                        <span className="font-semibold text-slate-600 w-1/2 capitalize">
                          {k.replace(/_/g, ' ')}:
                        </span>
                        <span className="w-1/2 text-slate-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tests */}
              {eq.testes && eq.testes.length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                    Resultados dos Testes
                  </div>
                  <div className="space-y-4">
                    {eq.testes.map((t: any) => (
                      <div key={t.id} className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="p-2 text-left text-slate-700 font-semibold w-1/3">
                                Teste Realizado
                              </th>
                              <th className="p-2 text-left text-slate-700 font-semibold w-1/3">
                                Equip. Utilizado
                              </th>
                              <th className="p-2 text-left text-slate-700 font-semibold w-1/6">
                                Data
                              </th>
                              <th className="p-2 text-left text-slate-700 font-semibold w-1/6">
                                Resultado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-2 font-medium">{t.tipo_teste}</td>
                              <td className="p-2">{t.equipamento_utilizado}</td>
                              <td className="p-2">{formatDate(t.data_teste)}</td>
                              <td className="p-2 font-bold text-blue-800">
                                {t.valor_teste !== undefined
                                  ? `${t.valor_teste} ${t.unidade}`
                                  : 'N/A'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {t.dados_detalhados && Object.keys(t.dados_detalhados).length > 0 && (
                          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs">
                            <div className="font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                              Detalhes da Medição
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderDetalhes(t.dados_detalhados)}
                            </div>
                          </div>
                        )}
                        {t.observacoes && (
                          <div className="p-2 bg-yellow-50/50 border-t border-slate-200 text-xs text-slate-700 italic">
                            <span className="font-semibold not-italic">Obs:</span> {t.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Opinion */}
              {eq.parecer && (
                <div>
                  <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                    Parecer Técnico Específico
                  </div>
                  <div className="border-l-4 border-slate-400 pl-4 py-2 bg-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-700">Status:</span>
                      <span
                        className={`font-bold uppercase px-2 py-0.5 rounded text-xs ${
                          eq.parecer.parecer === 'Conforme'
                            ? 'bg-green-100 text-green-800'
                            : eq.parecer.parecer === 'Não Conforme'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {eq.parecer.parecer}
                      </span>
                    </div>
                    {eq.parecer.justificativa_mudanca && (
                      <div className="mb-2 text-sm">
                        <span className="font-semibold text-slate-700 block">
                          Justificativa da Mudança:
                        </span>
                        <span className="text-slate-900">{eq.parecer.justificativa_mudanca}</span>
                      </div>
                    )}
                    {eq.parecer.observacoes && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700 block">Observações:</span>
                        <span className="text-slate-900 whitespace-pre-wrap">
                          {eq.parecer.observacoes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos */}
              {eq.fotos && eq.fotos.length > 0 && (
                <div className="pt-2 avoid-break">
                  <div className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                    Registro Fotográfico
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {eq.fotos.map((foto: string) => (
                      <img
                        key={foto}
                        src={pb.files.getURL(eq, foto)}
                        alt="Equipamento"
                        className="w-full h-48 object-cover border border-slate-300 rounded shadow-sm avoid-break"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* General Photos (Estrutura) */}
        {report.fotos_estrutura && report.fotos_estrutura.length > 0 && (
          <div className="mb-10 page-break avoid-break">
            <div className="bg-slate-800 text-white p-2 font-bold mb-4 uppercase text-xs tracking-wider">
              Fotos Gerais / Estrutura
            </div>
            <div className="grid grid-cols-2 gap-4">
              {report.fotos_estrutura.map((foto: string) => (
                <img
                  key={foto}
                  src={pb.files.getURL(report, foto)}
                  alt="Estrutura"
                  className="w-full h-64 object-cover border border-slate-300 rounded shadow-sm avoid-break"
                />
              ))}
            </div>
          </div>
        )}

        {/* Conclusion */}
        {(report.parecer_geral || report.observacoes) && (
          <div className="mb-10 avoid-break border-2 border-slate-800 rounded-sm">
            <div className="bg-slate-800 text-white p-3 font-bold text-base tracking-wide text-center uppercase">
              Conclusão Geral e Parecer Técnico
            </div>
            <div className="p-5 space-y-4 bg-slate-50">
              {report.parecer_geral && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b border-slate-300 pb-1">
                    Parecer Final
                  </h4>
                  <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-sm">
                    {report.parecer_geral}
                  </p>
                </div>
              )}
              {report.observacoes && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b border-slate-300 pb-1 mt-4">
                    Observações Adicionais
                  </h4>
                  <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-sm italic">
                    {report.observacoes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Line */}
        <div className="mt-20 pt-10 flex justify-center avoid-break">
          <div className="w-72 text-center">
            <div className="border-t border-black pt-2 font-bold text-sm">
              {autor.name || 'Responsável Técnico'}
            </div>
            <div className="text-xs text-slate-600 mt-1">ELETROTESTE ENGENHARIA E SERVIÇOS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
