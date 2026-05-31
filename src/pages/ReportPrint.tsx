import { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { getEquipmentFields } from '@/lib/equipment-templates'

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
  potencia: 'Potência (kVA)',
  isolacao: 'Isolação',
  classe_tensao: 'Classe de Tensão (kV)',
  corrente_primaria: 'Corrente Primária (A)',
  corrente_secundaria: 'Corrente Secundária (A)',
  exatidao: 'Exatidão',
  corrente_nominal: 'Corrente Nominal (A)',
  classe_isolamento: 'Classe de Isolamento (kV)',
  possui_fusivel: 'Contém Fusível?',
  fusivel_tipo: 'Tipo de Fusível',
  fusivel_corrente_nominal: 'Corrente Nominal do Fusível (A)',
  fusivel_fabricante: 'Fabricante do Fusível',
  tap_at: 'Tap de AT (V)',
  impedancia: 'Impedância (%)',
  condut_vs: 'Condut. de Vs (mm²)',
  meio_isolante: 'Meio Isolante',
  volume_oleo: 'Volume de Óleo (L)',
  peso_total: 'Peso Total (kg)',
  buchas: 'Buchas de AT e BT',
  desl_angular: 'Desl. Angular',
  ligado_em: 'Ligado em (V)',
  diagrama: 'Diagrama',
  potencia_simetrica: 'Potência Simétrica (MVA)',
  capacidade_ruptura: 'Capacidade de Ruptura (kA)',
  rele_minima_tensao: 'Relé de Mínima Tensão',
  rele_abertura: 'Relé de Abertura',
  rele_fechamento: 'Relé de Fechamento',
  motorizacao: 'Motorização',
  rele_supervisor: 'Relé Supervisor Trifásico',
  condutores: 'Condutores',
  secao: 'Seção',
  material_condutor: 'Material Condutor',
  tensao_nominal: 'Tensão Nominal (kV)',
  corrente_descarga: 'Corrente de Descarga (kA)',
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
  padrao: 'Padrão',
}

const getLabel = (key: string, tipoEquipamento?: string) => {
  if (tipoEquipamento) {
    const fields = getEquipmentFields(tipoEquipamento)
    const field = fields.find((f) => f.name === key)
    if (field) return field.label
  }
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

  const formatTestValue = (t: any, tipoEquipamento: string, subType?: string): string[] => {
    const formatNum = (val: any) => {
      if (typeof val === 'number' && !isNaN(val)) return new Intl.NumberFormat('pt-BR').format(val)
      return val
    }

    if (t.tipo_teste === 'Resistências dos Isolamentos') {
      if (tipoEquipamento === 'Condutor Elétrico') {
        const d = t.dados_detalhados || {}
        const calcRes = (fase: any) => {
          if (fase === undefined || fase === null) return '-'
          if (typeof fase !== 'object') return formatNum(fase)
          if (fase.resultado !== undefined) return formatNum(fase.resultado)
          const v1 = Number(fase.v1)
          const v2 = Number(fase.v2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }
        const a = calcRes(d.fase_a)
        const b = calcRes(d.fase_b)
        const c = calcRes(d.fase_c)
        const rVal = calcRes(d.reserva)
        const items = [`A: ${a}`, `B: ${b}`, `C: ${c}`]
        if (rVal !== '-') items.push(`R: ${rVal}`)
        return items
      } else if (
        tipoEquipamento === 'Transformador de Potencial' ||
        tipoEquipamento === 'Transformador de Corrente'
      ) {
        const d = t.dados_detalhados?.fases || {}
        const calcRes = (fase: any) => {
          if (fase === undefined || fase === null) return '-'
          if (typeof fase !== 'object') return formatNum(fase)
          if (fase.resultado !== undefined) return formatNum(fase.resultado)
          const v1 = Number(fase.valor1)
          const v2 = Number(fase.valor2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }
        const a = calcRes(d.A)
        const b = calcRes(d.B)
        const c = calcRes(d.C)
        return [`A: ${a}`, `B: ${b}`, `C: ${c}`]
      } else if (tipoEquipamento === 'Disjuntor') {
        const df = t.dados_detalhados?.fechado || {}
        const da = t.dados_detalhados?.aberto || {}
        const formatRes = (row: any) => {
          if (!row) return '-'
          if (row.resultado !== undefined) return formatNum(row.resultado)
          const v1 = Number(row.v1)
          const v2 = Number(row.v2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }
        const f_ab = formatRes(df.ab)
        const f_bc = formatRes(df.bc)
        const f_ca = formatRes(df.ac)
        const f_massa = formatRes(df.abc_massa)
        const a_aa = formatRes(da.aa)
        const a_bb = formatRes(da.bb)
        const a_cc = formatRes(da.cc)
        const fechadoItems = [
          `A x B: ${f_ab}`,
          `B x C: ${f_bc}`,
          `C x A: ${f_ca}`,
          `Massa: ${f_massa}`,
        ]
        const abertoItems = [`A x A: ${a_aa}`, `B x B: ${a_bb}`, `C x C: ${a_cc}`]
        if (subType === 'Fechado') return fechadoItems
        if (subType === 'Aberto') return abertoItems
        return [
          'Fechado:',
          ...fechadoItems.map((i) => `  ${i}`),
          'Aberto:',
          ...abertoItems.map((i) => `  ${i}`),
        ]
      } else if (tipoEquipamento === 'Transformador') {
        const d = t.dados_detalhados || {}
        const m = d.medicoes || d
        const calcRes = (row: any) => {
          if (!row) return '-'
          if (row.resultado !== undefined) return formatNum(row.resultado)
          const v1 = Number(row.v1)
          const v2 = Number(row.v2)
          if (!isNaN(v1) && !isNaN(v2)) return formatNum(v1 * v2)
          return '-'
        }
        return [
          `A/B: ${calcRes(m.alta_baixa)}`,
          `A/M: ${calcRes(m.alta_massa)}`,
          `B/M: ${calcRes(m.baixa_massa)}`,
        ]
      } else {
        const d = t.dados_detalhados || {}
        const ab = formatNum((Number(d.ab?.v1) || 0) * (Number(d.ab?.v2) || 0))
        const bc = formatNum((Number(d.bc?.v1) || 0) * (Number(d.bc?.v2) || 0))
        const ac = formatNum((Number(d.ac?.v1) || 0) * (Number(d.ac?.v2) || 0))
        const abcm = formatNum((Number(d.abc_massa?.v1) || 0) * (Number(d.abc_massa?.v2) || 0))
        return [`AB: ${ab}`, `BC: ${bc}`, `CA: ${ac}`, `ABC-M: ${abcm}`]
      }
    }
    if (t.tipo_teste === 'Resistências dos Enrolamentos') {
      const ets = t.dados_detalhados?.ets || {}
      const eti = t.dados_detalhados?.eti || {}
      const ets_corr = t.dados_detalhados?.ets_corr
      const eti_corr = t.dados_detalhados?.eti_corr
      const calc = t.dados_detalhados?.resultados_calculados
      const tRef = t.dados_detalhados?.temperatura_referencia || 75
      const formatField = (val: any) =>
        val !== undefined && val !== null && val !== '' ? `${formatNum(val)}` : '-'
      const f_ets = [
        `H1-H3: ${formatField(ets.h1_h3)}`,
        `H2-H1: ${formatField(ets.h2_h1)}`,
        `H3-H2: ${formatField(ets.h3_h2)}`,
      ]
      const f_eti = [
        `X1-X3: ${formatField(eti.x1_x3)}`,
        `X2-X1: ${formatField(eti.x2_x1)}`,
        `X3-X2: ${formatField(eti.x3_x2)}`,
      ]
      if (calc) {
        if (calc.ets_75 !== null && calc.ets_75 !== undefined)
          f_ets.push(`Média 75ºC: ${formatField(calc.ets_75)}`)
        else if (calc.ets_105 !== null && calc.ets_105 !== undefined)
          f_ets.push(`Média 105ºC: ${formatField(calc.ets_105)}`)
        if (calc.eti_75 !== null && calc.eti_75 !== undefined)
          f_eti.push(`Média 75ºC: ${formatField(calc.eti_75)}`)
        else if (calc.eti_105 !== null && calc.eti_105 !== undefined)
          f_eti.push(`Média 105ºC: ${formatField(calc.eti_105)}`)
      } else if (ets_corr || eti_corr) {
        if (ets_corr) {
          f_ets.push(`Corr. ${tRef}ºC:`)
          f_ets.push(`  H1-H3: ${formatField(ets_corr.h1_h3)}`)
          f_ets.push(`  H2-H1: ${formatField(ets_corr.h2_h1)}`)
          f_ets.push(`  H3-H2: ${formatField(ets_corr.h3_h2)}`)
        }
        if (eti_corr) {
          f_eti.push(`Corr. ${tRef}ºC:`)
          f_eti.push(`  X1-X3: ${formatField(eti_corr.x1_x3)}`)
          f_eti.push(`  X2-X1: ${formatField(eti_corr.x2_x1)}`)
          f_eti.push(`  X3-X2: ${formatField(eti_corr.x3_x2)}`)
        }
      }
      if (subType === 'ETS') return f_ets
      if (subType === 'ETI') return f_eti
      return ['ETS:', ...f_ets.map((i) => `  ${i}`), 'ETI:', ...f_eti.map((i) => `  ${i}`)]
    }
    if (t.tipo_teste === 'Resistências dos Contatos') {
      const d = t.dados_detalhados || {}
      return [
        `A: ${formatNum(d.fase_a) ?? '-'}`,
        `B: ${formatNum(d.fase_b) ?? '-'}`,
        `C: ${formatNum(d.fase_c) ?? '-'}`,
      ]
    }
    if (t.tipo_teste === 'Relação de Tensões' && tipoEquipamento === 'Transformador') {
      const d = t.dados_detalhados || {}
      return [
        `Posição: ${d.posicao || '-'}`,
        `H1H3/X0X1: ${formatNum(d.h1h3_x0x1) || '-'}`,
        `H2H1/X0X2: ${formatNum(d.h2h1_x0x2) || '-'}`,
        `H3H2/X0X3: ${formatNum(d.h3h2_x0x3) || '-'}`,
      ]
    }
    return [`${formatNum(t.valor_teste)}`]
  }

  return (
    <div className="bg-slate-200 print:bg-transparent min-h-screen text-black font-sans pb-12 print:pb-0">
      <style type="text/css">
        {`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .break-before-page {
              page-break-before: always;
              break-before: page;
            }
            .break-after-page {
              page-break-after: always;
              break-after: page;
            }
          }
        `}
      </style>
      {/* Action Bar - Hidden on print */}
      <div className="print:hidden bg-white p-4 flex justify-between items-center fixed top-0 w-full shadow-md z-50 border-b border-slate-200">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
        >
          <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
        </Button>
      </div>

      {/* Cover Page */}
      <div className="relative w-full aspect-[210/297] max-w-[210mm] mx-auto bg-slate-900 flex flex-col justify-end break-after-page print:aspect-auto print:h-[277mm] print:max-w-none shadow-xl print:shadow-none mb-8 print:mb-0 mt-24 print:mt-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/800/1130?q=electrical%20engineering&color=blue&dpr=2"
            alt="Cover Background"
            className="w-full h-full object-cover opacity-25 mix-blend-overlay"
          />
        </div>
        <div className="z-10 flex flex-col items-start justify-end p-8 sm:p-12 w-full h-full pb-16">
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col items-start w-full max-w-xl border-l-[10px] border-blue-900 relative">
            <div className="flex items-center justify-start h-16 mb-6 w-full">
              <img
                src="/logotransparente-c06b6.png"
                alt="Eletroteste Logo"
                className="max-h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase leading-snug tracking-tight text-left">
              LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA EM CABINE PRIMÁRIA
            </h1>
            <div className="w-12 h-1 bg-blue-700 my-6 rounded-full"></div>

            <div className="w-full text-left space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Cliente
                </p>
                <p className="text-[18px] font-bold text-slate-800 leading-none">
                  {cliente.nome_empresa || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Relatório Nº
                </p>
                <p className="text-[18px] font-bold text-slate-800 leading-none">
                  {report.numero_relatorio}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="px-8 pb-8 max-w-[210mm] mx-auto text-sm print:max-w-none print:pt-0 print:px-12 print:pb-0 font-sans bg-white shadow-xl print:shadow-none">
        <table className="w-full">
          <thead className="table-header-group">
            <tr>
              <td>
                {/* Technical Header (Carimbo) */}
                <div className="print:mt-4 border-t-[6px] border-blue-900 pb-2 mb-4">
                  <table className="w-full border-collapse border border-slate-800 mt-2 text-sm bg-white">
                    <tbody>
                      <tr>
                        <td className="border border-slate-800 w-[25%] p-3 align-middle text-center">
                          <div className="flex items-center justify-center h-full min-h-[4rem]">
                            <img
                              src="/logotransparente-c06b6.png"
                              alt="Eletroteste Logo"
                              className="max-h-12 w-auto object-contain"
                            />
                          </div>
                        </td>
                        <td className="border border-slate-800 w-[50%] p-3 text-center align-middle">
                          <div className="font-extrabold text-base text-slate-900 uppercase tracking-tight">
                            LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA EM CABINE PRIMÁRIA
                          </div>
                          <div className="text-xs text-slate-600 mt-1.5 font-semibold">
                            Normas de Referência: NBR 14039 / NBR 5410
                          </div>
                        </td>
                        <td className="border border-slate-800 w-[25%] p-4 align-middle text-sm text-slate-800 text-center bg-slate-50">
                          <strong className="text-slate-500 block text-[10px] uppercase tracking-widest mb-1">
                            Relatório Nº
                          </strong>
                          <span className="font-bold text-lg text-blue-900 leading-none">
                            {report.numero_relatorio}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </thead>
          <tbody className="table-row-group">
            <tr>
              <td>
                {/* Client and Report Info */}
                <div className="mb-4 avoid-break">
                  <div className="bg-slate-800 text-white p-2 font-bold mb-2 uppercase text-xs tracking-wider">
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
                        <td className="border border-slate-300 p-2">
                          {report.numero_proposta || 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Execution Info */}
                <div className="mb-4 avoid-break">
                  <div className="bg-slate-800 text-white p-2 font-bold mb-2 uppercase text-xs tracking-wider">
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
                        <td className="border border-slate-300 p-2 w-1/4">
                          {formatDate(report.data_fim)}
                        </td>
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
                        <td className="border border-slate-300 p-2 font-medium">
                          {autor.name || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-semibold bg-slate-100 text-slate-700">
                          Temp. Ambiente
                        </td>
                        <td className="border border-slate-300 p-2">
                          {report.temperatura_ambiente
                            ? `${report.temperatura_ambiente} °C`
                            : 'N/A'}
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
                  <div
                    key={eq.id}
                    className="mb-4 break-before-page border border-slate-400 bg-white"
                  >
                    <div className="bg-slate-200 text-slate-900 p-2 font-bold text-sm border-b border-slate-400 uppercase tracking-wide">
                      {i + 1}. EQUIPAMENTO: {eq.tipo_equipamento}
                    </div>

                    <div className="p-3 space-y-3">
                      {/* Technical Data */}
                      {eq.dados_tecnicos && Object.keys(eq.dados_tecnicos).length > 0 && (
                        <div>
                          <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                            Características Técnicas
                          </div>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                            {(() => {
                              const fields = getEquipmentFields(eq.tipo_equipamento)
                              const mappedKeys = new Set<string>()

                              const orderedData = fields
                                .filter((f) => {
                                  if (f.dependsOn) {
                                    const depVal = eq.dados_tecnicos[f.dependsOn.field]
                                    if (depVal !== f.dependsOn.value) return false
                                  }
                                  const val = eq.dados_tecnicos[f.name]
                                  return val !== undefined && val !== null && val !== ''
                                })
                                .map((f) => {
                                  mappedKeys.add(f.name)
                                  return {
                                    key: f.name,
                                    label: f.label,
                                    value: eq.dados_tecnicos[f.name],
                                  }
                                })

                              const unmappedData = Object.entries(eq.dados_tecnicos)
                                .filter(
                                  ([k, val]) =>
                                    !mappedKeys.has(k) &&
                                    val !== undefined &&
                                    val !== null &&
                                    val !== '',
                                )
                                .map(([k, val]) => ({
                                  key: k,
                                  label: getLabel(k, eq.tipo_equipamento),
                                  value: val,
                                }))

                              const allData = [...orderedData, ...unmappedData]

                              if (allData.length === 0) {
                                return (
                                  <div className="text-[11px] text-slate-500 italic col-span-3">
                                    Nenhuma característica preenchida.
                                  </div>
                                )
                              }

                              return allData.map(({ key, label, value }) => (
                                <div
                                  key={key}
                                  className="flex items-baseline text-[11px] border-b border-slate-200 pb-0.5"
                                >
                                  <span className="font-semibold text-slate-600 whitespace-nowrap pr-1 leading-tight">
                                    {label}:
                                  </span>
                                  <span className="text-slate-900 break-words leading-tight">
                                    {typeof value === 'boolean'
                                      ? value
                                        ? 'Sim'
                                        : 'Não'
                                      : String(value)}
                                  </span>
                                </div>
                              ))
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Tests */}
                      {eq.testes && eq.testes.length > 0 && (
                        <div className="mt-6">
                          <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                            Resultados dos Testes
                          </div>
                          <div className="border border-slate-200 rounded overflow-hidden">
                            <table className="w-full text-[11px] border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="p-2 text-left text-slate-700 font-semibold w-[15%] border-r border-slate-200 whitespace-nowrap">
                                    Data
                                  </th>
                                  <th className="p-2 text-left text-slate-700 font-semibold w-[25%] border-r border-slate-200 whitespace-nowrap">
                                    Teste Realizado
                                  </th>
                                  <th className="p-2 text-left text-slate-700 font-semibold w-[60%]">
                                    Resultados
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {eq.testes.map((t: any, index: number) => {
                                  const resultsArray = formatTestValue(t, eq.tipo_equipamento)
                                  const resultsStr =
                                    resultsArray
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                      .join(' | ') + (t.unidade ? ` ${t.unidade}` : '')
                                  const hasObservacao = !!t.observacoes

                                  return (
                                    <Fragment key={t.id}>
                                      <tr
                                        className={`avoid-break ${index > 0 ? 'border-t border-slate-200' : ''}`}
                                      >
                                        <td className="p-2 align-top border-r border-slate-200 font-semibold whitespace-nowrap">
                                          {formatDate(t.data_teste)}
                                        </td>
                                        <td className="p-2 align-top border-r border-slate-200 whitespace-nowrap">
                                          {t.tipo_teste}
                                        </td>
                                        <td className="p-2 align-top text-blue-900 font-bold whitespace-pre-wrap">
                                          {resultsStr}
                                        </td>
                                      </tr>
                                      <tr className="avoid-break bg-slate-50/50 border-t border-slate-200">
                                        <td colSpan={3} className="px-2 py-1 text-slate-600">
                                          <span className="font-semibold">
                                            Equipamento Utilizado:
                                          </span>{' '}
                                          {t.equipamento_utilizado}
                                        </td>
                                      </tr>
                                      {hasObservacao && (
                                        <tr className="avoid-break bg-yellow-50/50 border-t border-slate-200">
                                          <td
                                            colSpan={3}
                                            className="px-2 py-1 text-slate-700 italic"
                                          >
                                            <span className="font-semibold not-italic">
                                              Observações:
                                            </span>{' '}
                                            <span className="whitespace-pre-wrap">
                                              {t.observacoes}
                                            </span>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Technical Opinion */}
                      {eq.parecer && (
                        <div className="mt-6">
                          <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                            Parecer Técnico Específico
                          </div>
                          <div className="border-l-4 border-slate-400 pl-4 py-2 bg-slate-50">
                            <div className="flex items-center gap-2 mb-2 text-[11px]">
                              <span className="font-semibold text-slate-700">Status:</span>
                              <span
                                className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] ${
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
                              <div className="mb-2 text-[11px]">
                                <span className="font-semibold text-slate-700 block">
                                  Justificativa da Mudança:
                                </span>
                                <span className="text-slate-900">
                                  {eq.parecer.justificativa_mudanca}
                                </span>
                              </div>
                            )}
                            {eq.parecer.observacoes && (
                              <div className="text-[11px]">
                                <span className="font-semibold text-slate-700 block">
                                  Observações:
                                </span>
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
                        <div className="avoid-break mt-6">
                          <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                            REGISTRO FOTOGRÁFICO
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {eq.fotos.map((foto: string) => (
                              <img
                                key={foto}
                                src={pb.files.getURL(eq, foto)}
                                alt="Equipamento"
                                className="w-full h-56 object-contain border border-slate-300 rounded shadow-sm avoid-break bg-slate-50 p-1"
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
                  <div className="mb-6 break-before-page avoid-break border border-slate-400 bg-white p-3">
                    <div className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-xs uppercase tracking-wider">
                      REGISTRO FOTOGRÁFICO - GERAL / ESTRUTURA
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {report.fotos_estrutura.map((foto: string) => (
                        <img
                          key={foto}
                          src={pb.files.getURL(report, foto)}
                          alt="Estrutura"
                          className="w-full h-64 object-contain border border-slate-300 rounded shadow-sm avoid-break bg-slate-50 p-1"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Conclusion */}
                {(report.parecer_geral || report.observacoes) && (
                  <div className="mb-4 avoid-break border-2 border-slate-800 rounded-sm mt-6">
                    <div className="bg-slate-800 text-white p-2 font-bold text-sm tracking-wide text-center uppercase">
                      Conclusão Geral e Parecer Técnico
                    </div>
                    <div className="p-4 space-y-3 bg-slate-50">
                      {report.parecer_geral && (
                        <div>
                          <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b border-slate-300 pb-1">
                            Parecer Final
                          </h4>
                          <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-[11px]">
                            {report.parecer_geral}
                          </p>
                        </div>
                      )}
                      {report.observacoes && (
                        <div>
                          <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b border-slate-300 pb-1 mt-4">
                            Observações Adicionais
                          </h4>
                          <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-[11px] italic">
                            {report.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Signature Line */}
                <div className="mt-12 pt-6 pb-6 flex justify-center avoid-break">
                  <div className="w-72 text-center">
                    <div className="border-t border-black pt-2 font-bold text-sm">
                      {autor.name || 'Responsável Técnico'}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      ELETROTESTE ENGENHARIA E SERVIÇOS
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot className="table-footer-group">
            <tr>
              <td>
                {/* Corporate Standardized Footer */}
                <div className="print:mb-2 mt-4 border-t-[1.5px] border-slate-800 pt-2 text-[10px] text-slate-600 bg-white leading-tight">
                  <div className="flex justify-between items-start gap-2 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        <strong>CNPJ:</strong> 64.941.818/0001-91 &nbsp;|&nbsp; <strong>IE:</strong>{' '}
                        748.001.165.111 &nbsp;|&nbsp; <strong>IM:</strong> 688
                      </span>
                      <span>Rua Andradina, 262 - Remanso Campineiro - Hortolândia - SP</span>
                    </div>
                    <div className="flex flex-col text-right gap-0.5">
                      <span>
                        <strong>Tels:</strong> (19) 3865-2942 / 3865-1261 &nbsp;|&nbsp;{' '}
                        <strong>WhatsApp:</strong> (19) 9 7143-3853
                      </span>
                      <span>
                        <strong>Site:</strong> www.eletroteste.com &nbsp;|&nbsp;{' '}
                        <strong>E-mail:</strong> eletroteste@eletroteste.com
                      </span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
