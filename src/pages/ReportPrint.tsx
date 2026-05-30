import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'

const labelMap: Record<string, string> = {
  observacoes: 'Observações',
  inicio: 'Início',
  relacao: 'Relação',
  caracteristicas: 'Características',
  efetuado: 'Efetuado',
  proxima_manutencao: 'Próxima Manutenção',
  parecer_tecnico: 'Parecer Técnico',
  dados_tecnicos: 'Dados Técnicos',
  fase_a: 'Fase A',
  fase_b: 'Fase B',
  fase_c: 'Fase C',
  fase_a_massa: 'Fase A x Massa',
  fase_b_massa: 'Fase B x Massa',
  fase_c_massa: 'Fase C x Massa',
  fase_a_fase_b: 'Fase A x Fase B',
  fase_b_fase_c: 'Fase B x Fase C',
  fase_c_fase_a: 'Fase C x Fase A',
  h_massa: 'H x Massa',
  x_massa: 'X x Massa',
  h_x: 'H x X',
  r_s: 'R x S',
  s_t: 'S x T',
  t_r: 'T x R',
  r_massa: 'R x Massa',
  s_massa: 'S x Massa',
  t_massa: 'T x Massa',
  tensao_primaria: 'Tensão Primária (V)',
  tensao_secundaria: 'Tensão Secundária (V)',
  potencia: 'Potência',
  isolacao: 'Isolação',
  classe_tensao: 'Classe de Tensão',
  corrente_primaria: 'Corrente Primária (A)',
  corrente_secundaria: 'Corrente Secundária (A)',
  exatidao: 'Exatidão',
  corrente_nominal: 'Corrente Nominal',
  classe_isolamento: 'Classe de Isolamento',
  possui_fusivel: 'Possui Fusível',
  fusivel_tipo: 'Tipo de Fusível',
  fusivel_corrente_nominal: 'Corrente Nominal do Fusível',
  fusivel_fabricante: 'Fabricante do Fusível',
  tap_at: 'Tap de AT',
  impedancia: 'Impedância (%)',
  condut_vs: 'Condut. de Vs (mm²)',
  meio_isolante: 'Meio Isolante',
  volume_oleo: 'Volume de Óleo (L)',
  peso_total: 'Peso Total (kg)',
  buchas: 'Buchas de AT e BT',
  desl_angular: 'Deslocamento Angular',
  ligado_em: 'Ligado Em',
  diagrama: 'Diagrama',
  potencia_simetrica: 'Potência Simétrica',
  capacidade_ruptura: 'Capacidade de Ruptura',
  rele_minima_tensao: 'Relé de Mínima Tensão',
  rele_abertura: 'Relé de Abertura',
  rele_fechamento: 'Relé de Fechamento',
  motorizacao: 'Motorização',
  rele_supervisor: 'Relé Supervisor',
  condutores: 'Condutores',
  secao: 'Seção',
  material_condutor: 'Material Condutor',
  tensao_nominal: 'Tensão Nominal',
  corrente_descarga: 'Corrente de Descarga',
  tipo_modelo: 'Tipo/Modelo',
  subestacao: 'Subestação',
  identificacao: 'Identificação',
  numero: 'Número',
  fabricante: 'Fabricante',
  tipo: 'Tipo',
  circuito: 'Circuito',
  ajuste_i_fase: 'I> Fase',
  ajuste_curva_fase: 'Curva Fase',
  ajuste_dt_fase: 'Dt Fase',
  ajuste_i_def_fase: 'I.Def. Fase',
  ajuste_t_def_fase: 'T.Def. Fase',
  ajuste_i_3_fase: 'I>>> Fase',
  ajuste_ie_neutro: 'Ie> Neutro',
  ajuste_curva_neutro: 'Curva Neutro',
  ajuste_dt_neutro: 'Dt Neutro',
  ajuste_i_gs_neutro: 'I.GS. Neutro',
  ajuste_t_gs_neutro: 'T.GS. Neutro',
  ajuste_ie_3_neutro: 'Ie>>> Neutro',
  ajuste_v_maior: 'V>',
  ajuste_t_v_maior: 'T.V>',
  ajuste_v_menor: 'V<',
  ajuste_t_v_menor: 'T.V<',
}

const getLabel = (key: string) => {
  const lowerKey = key.toLowerCase()
  if (labelMap[lowerKey]) return labelMap[lowerKey]
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

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

    const isFlat = Object.values(detalhes).every((v) => typeof v !== 'object' || v === null)

    if (isFlat) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          {Object.entries(detalhes).map(([k, v]) => (
            <div
              key={k}
              className="flex flex-col border border-slate-200 rounded p-1.5 bg-white shadow-sm"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {getLabel(k)}
              </span>
              <span className="text-sm font-medium text-slate-900">{String(v)}</span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4 w-full">
        {Object.entries(detalhes).map(([k, v]) => {
          if (typeof v === 'object' && v !== null) {
            return (
              <div key={k} className="w-full">
                <span className="font-semibold text-slate-700 text-xs uppercase block mb-1.5">
                  {getLabel(k)}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(v).map(([sk, sv]) => (
                    <div
                      key={sk}
                      className="flex flex-col border border-slate-200 rounded p-1.5 bg-white shadow-sm"
                    >
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {getLabel(sk)}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{String(sv)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          return (
            <div
              key={k}
              className="flex flex-col border border-slate-200 rounded p-1.5 bg-white shadow-sm w-fit min-w-[120px]"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {getLabel(k)}
              </span>
              <span className="text-sm font-medium text-slate-900">{String(v)}</span>
            </div>
          )
        })}
      </div>
    )
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
                  Próxima Manutenção
                </td>
                <td className="border border-slate-300 p-2">
                  {formatDate(report.proxima_manutencao)}
                </td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Responsável Técnico
                </td>
                <td className="border border-slate-300 p-2 font-medium">{autor.name || 'N/A'}</td>
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
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                  Acompanhante
                </td>
                <td className="border border-slate-300 p-2" colSpan={3}>
                  {report.acompanhante || 'N/A'}
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
                        <span className="font-semibold text-slate-600 w-1/2">{getLabel(k)}:</span>
                        <span className="w-1/2 text-slate-900">
                          {typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : String(v)}
                        </span>
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
                                Equipamento Utilizado
                              </th>
                              <th className="p-2 text-left text-slate-700 font-semibold w-1/6">
                                Data
                              </th>
                              <th className="p-2 text-left text-slate-700 font-semibold w-1/6">
                                Resultado Geral
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-2 font-medium">{t.tipo_teste}</td>
                              <td className="p-2">{t.equipamento_utilizado}</td>
                              <td className="p-2">{formatDate(t.data_teste)}</td>
                              <td className="p-2 font-bold text-blue-800">
                                {t.valor_teste !== undefined && t.valor_teste !== null
                                  ? `${t.valor_teste} ${t.unidade}`
                                  : 'N/A'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {t.dados_detalhados && Object.keys(t.dados_detalhados).length > 0 && (
                          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs">
                            <div className="font-semibold text-slate-500 mb-2 uppercase tracking-wide text-[10px]">
                              Detalhes da Medição
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {renderDetalhes(t.dados_detalhados)}
                            </div>
                          </div>
                        )}
                        {t.observacoes && (
                          <div className="p-2 bg-yellow-50/50 border-t border-slate-200 text-xs text-slate-700 italic">
                            <span className="font-semibold not-italic">Observações:</span>{' '}
                            {t.observacoes}
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
