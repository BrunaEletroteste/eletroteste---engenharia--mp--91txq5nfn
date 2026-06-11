import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import logoImg from '@/assets/logotransparente-c06b6.png'

function getBadgeClass(status: string) {
  if (status === 'Conforme')
    return 'bg-green-100 text-green-800 border-green-200 print:bg-green-100 print:text-green-800'
  if (status === 'Não Conforme')
    return 'bg-red-100 text-red-800 border-red-200 print:bg-red-100 print:text-red-800'
  return 'bg-amber-100 text-amber-800 border-amber-200 print:bg-amber-100 print:text-amber-800'
}

export default function ReportPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        const relatorio = await pb
          .collection('relatorios')
          .getOne(id, { expand: 'cliente_id,criado_por' })
        const equipamentos = await pb
          .collection('equipamentos_relatorio')
          .getFullList({ filter: `relatorio_id="${id}"`, sort: 'ordem' })
        const testes = await pb
          .collection('testes_equipamento')
          .getFullList({ filter: `equipamento_id.relatorio_id="${id}"` })
        const pareceres = await pb
          .collection('parecer_tecnico')
          .getFullList({ filter: `equipamento_id.relatorio_id="${id}"` })

        setData({
          relatorio,
          equipamentos: equipamentos.map((eq) => ({
            ...eq,
            testes: testes.filter((t) => t.equipamento_id === eq.id),
            parecer: pareceres.find((p) => p.equipamento_id === eq.id),
          })),
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Relatório não encontrado.</p>
      </div>
    )
  }

  const { relatorio, equipamentos } = data
  const cliente = relatorio.expand?.cliente_id

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="bg-white w-full max-w-[210mm] mx-auto min-h-[297mm] p-[20mm] shadow-lg print:shadow-none print:max-w-none print:w-auto print:min-h-auto print:p-0 print:m-0">
        <header className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-center">
          <div className="flex flex-col items-center justify-center">
            <img
              src={logoImg}
              alt="Eletroteste Logo"
              className="max-h-12 w-auto object-contain block mb-2"
            />
            <span className="text-[10px] font-bold text-slate-600 leading-none">
              - Desde 1990 -
            </span>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-slate-800">
              {relatorio.tipo_laudo === 'PREVENTIVA_CORRETIVA'
                ? 'LAUDO DE MANUTENÇÃO PREVENTIVA E CORRETIVA'
                : 'LAUDO DE MANUTENÇÃO PREVENTIVA'}
            </h1>
            <p className="text-sm text-slate-600 font-semibold">
              Relatório Nº: {relatorio.numero_relatorio}
            </p>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 mb-3 bg-slate-100 px-2 py-1 print:bg-slate-100">
            Dados do Cliente
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm px-2">
            <div>
              <p>
                <span className="font-semibold">Empresa:</span> {cliente?.nome_empresa}
              </p>
              <p>
                <span className="font-semibold">CNPJ:</span> {cliente?.cnpj}
              </p>
              <p>
                <span className="font-semibold">Endereço:</span> {cliente?.endereco || '-'}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Data Execução:</span>{' '}
                {format(new Date(relatorio.data_execucao), 'dd/MM/yyyy')}
              </p>
              {relatorio.data_fim && (
                <p>
                  <span className="font-semibold">Data Término:</span>{' '}
                  {format(new Date(relatorio.data_fim), 'dd/MM/yyyy')}
                </p>
              )}
              <p>
                <span className="font-semibold">Responsável Técnico:</span>{' '}
                {relatorio.responsavel_tecnico || '-'}
              </p>
              {relatorio.acompanhante && (
                <p>
                  <span className="font-semibold">Acompanhante:</span> {relatorio.acompanhante}
                </p>
              )}
            </div>
          </div>
        </section>

        {(relatorio.obra || relatorio.observacoes) && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 mb-3 bg-slate-100 px-2 py-1 print:bg-slate-100">
              Informações Gerais
            </h2>
            <div className="text-sm px-2 space-y-2">
              {relatorio.obra && (
                <p>
                  <span className="font-semibold">Obra:</span> {relatorio.obra}
                </p>
              )}
              {relatorio.observacoes && (
                <div>
                  <span className="font-semibold">Observações:</span>
                  <p className="whitespace-pre-wrap mt-1 text-justify">{relatorio.observacoes}</p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 mb-4 bg-slate-100 px-2 py-1 print:bg-slate-100">
            Equipamentos e Testes
          </h2>
          {equipamentos.length === 0 ? (
            <p className="text-sm text-slate-500 px-2">Nenhum equipamento registrado.</p>
          ) : (
            <div className="space-y-8">
              {equipamentos.map((eq: any, idx: number) => (
                <div key={eq.id} className="border border-slate-200 rounded p-4 break-inside-avoid">
                  <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h3 className="text-md font-bold text-slate-800">
                      {idx + 1}. {eq.tipo_equipamento}
                    </h3>
                    {eq.parecer && (
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded border ${getBadgeClass(eq.parecer.parecer)}`}
                      >
                        {eq.parecer.parecer}
                      </span>
                    )}
                  </div>

                  {eq.dados_tecnicos && Object.keys(eq.dados_tecnicos).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Dados Técnicos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {Object.entries(eq.dados_tecnicos).map(([k, v]) => (
                          <div key={k} className="bg-slate-50 p-1.5 rounded print:bg-slate-50">
                            <span className="font-semibold block capitalize">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eq.testes && eq.testes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        Testes Realizados
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 print:bg-slate-100">
                              <th className="border border-slate-200 px-2 py-1">Tipo de Teste</th>
                              <th className="border border-slate-200 px-2 py-1">Valor</th>
                              <th className="border border-slate-200 px-2 py-1">
                                Equip. Utilizado
                              </th>
                              <th className="border border-slate-200 px-2 py-1">Data</th>
                              <th className="border border-slate-200 px-2 py-1">Observações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eq.testes.map((t: any) => (
                              <tr key={t.id}>
                                <td className="border border-slate-200 px-2 py-1 font-medium">
                                  {t.tipo_teste}
                                </td>
                                <td className="border border-slate-200 px-2 py-1">
                                  {t.valor_teste != null ? `${t.valor_teste} ${t.unidade}` : '-'}
                                </td>
                                <td className="border border-slate-200 px-2 py-1">
                                  {t.equipamento_utilizado}
                                </td>
                                <td className="border border-slate-200 px-2 py-1">
                                  {format(new Date(t.data_teste), 'dd/MM/yyyy')}
                                </td>
                                <td className="border border-slate-200 px-2 py-1 text-slate-600">
                                  {t.observacoes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {eq.parecer?.observacoes && (
                    <div className="mb-4 text-xs bg-slate-50 p-2 rounded border border-slate-100 print:bg-slate-50">
                      <span className="font-semibold text-slate-800">Parecer - Observações: </span>
                      <span className="text-slate-700">{eq.parecer.observacoes}</span>
                    </div>
                  )}

                  {eq.fotos && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        Registro Fotográfico
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {(Array.isArray(eq.fotos) ? eq.fotos : [eq.fotos]).map((f: string) => (
                          <img
                            key={f}
                            src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/equipamentos_relatorio/${eq.id}/${f}`}
                            alt="Foto do equipamento"
                            className="w-32 h-32 object-cover border border-slate-200 rounded shadow-sm print:shadow-none print:border-slate-300"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
