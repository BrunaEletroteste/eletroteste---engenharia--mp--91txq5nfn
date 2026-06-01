import { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2, Cpu } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { getEquipmentFields } from '@/lib/equipment-templates'
import { formatNumberPtBR } from '@/lib/format'
import logoImg from '@/assets/logotransparente-c06b6.png'

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
  fusivel_tipo: 'Tipo dos Fusíveis',
  fusivel_corrente_nominal: 'Corrente dos Fusíveis (A)',
  fusivel_fabricante: 'Fabricante do Fusível',
  tap_at: 'Tap de AT (V)',
  impedancia: 'Impedância (%)',
  condut_vs: 'Condut. de Vs (mm²)',
  meio_isolante: 'Meio Isolante',
  volume_oleo: 'Volume de Óleo (L)',
  peso_total: 'Peso Total (kg)',
  buchas: 'Buchas de AT e BT (Tampa Superior)',
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
        <Loader2 className="animate-spin h-8 w-8 text-blue-900" />
        <span className="ml-3 font-medium text-[16px]">Preparando documento...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-black flex-col">
        <p className="text-[16px] font-semibold mb-4">Erro ao carregar relatório.</p>
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
    const formatNum = (val: any, isRelacao = false) => {
      if (typeof val === 'number' && !isNaN(val)) {
        return isRelacao ? formatNumberPtBR(val, 3, 3) : formatNumberPtBR(val, 4)
      }
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
        const a_bb = formatRes(da.da)
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
        val !== undefined && val !== null && val !== '' ? `${formatNumberPtBR(val, 2, 2)}` : '-'
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
        `H1H3/X0X1: ${formatNum(d.h1h3_x0x1, true) || '-'}`,
        `H2H1/X0X2: ${formatNum(d.h2h1_x0x2, true) || '-'}`,
        `H3H2/X0X3: ${formatNum(d.h3h2_x0x3, true) || '-'}`,
      ]
    }
    return [`${formatNum(t.valor_teste)}`]
  }

  return (
    <div className="bg-slate-200 print:bg-white min-h-screen text-black font-sans pb-12 print:pb-0">
      <style type="text/css">
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
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
      <div className="w-full h-[297mm] max-w-[210mm] mx-auto bg-white flex flex-col justify-center items-center break-after-page print:max-w-none shadow-xl print:shadow-none mb-8 print:mb-0 mt-24 print:mt-0 overflow-hidden box-border p-10 relative">
        {/* Background Circuit Pattern (Top Fade-out) */}
        <div
          className="absolute inset-0 z-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23cbd5e1' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10,10 l20,0 l10,10 l0,20 l10,10 l20,0' /%3E%3Cpath d='M90,10 l-20,0 l-10,10 l0,20 l-10,10 l-20,0' /%3E%3Cpath d='M10,90 l20,0 l10,-10 l0,-20 l10,-10 l20,0' /%3E%3Cpath d='M90,90 l-20,0 l-10,-10 l0,-20 l-10,-10 l-20,0' /%3E%3Cpath d='M50,10 l0,15 l15,15' /%3E%3Cpath d='M50,90 l0,-15 l-15,-15' /%3E%3Cpath d='M10,50 l15,0 l15,15' /%3E%3Cpath d='M90,50 l-15,0 l-15,-15' /%3E%3C/g%3E%3Cg fill='%2394a3b8'%3E%3Ccircle cx='10' cy='10' r='2.5' /%3E%3Ccircle cx='90' cy='10' r='2.5' /%3E%3Ccircle cx='10' cy='90' r='2.5' /%3E%3Ccircle cx='90' cy='90' r='2.5' /%3E%3Ccircle cx='70' cy='50' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='50' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='50' cy='30' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='50' cy='70' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='10' cy='50' r='2' /%3E%3Ccircle cx='90' cy='50' r='2' /%3E%3Ccircle cx='50' cy='10' r='2' /%3E%3Ccircle cx='50' cy='90' r='2' /%3E%3C/g%3E%3C/svg%3E\")",
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 35%)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 35%)',
          }}
        ></div>

        {/* Background Circuit Pattern (Bottom Fade-in) */}
        <div
          className="absolute inset-0 z-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23cbd5e1' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10,10 l20,0 l10,10 l0,20 l10,10 l20,0' /%3E%3Cpath d='M90,10 l-20,0 l-10,10 l0,20 l-10,10 l-20,0' /%3E%3Cpath d='M10,90 l20,0 l10,-10 l0,-20 l10,-10 l20,0' /%3E%3Cpath d='M90,90 l-20,0 l-10,-10 l0,-20 l-10,-10 l-20,0' /%3E%3Cpath d='M50,10 l0,15 l15,15' /%3E%3Cpath d='M50,90 l0,-15 l-15,-15' /%3E%3Cpath d='M10,50 l15,0 l15,15' /%3E%3Cpath d='M90,50 l-15,0 l-15,-15' /%3E%3C/g%3E%3Cg fill='%2394a3b8'%3E%3Ccircle cx='10' cy='10' r='2.5' /%3E%3Ccircle cx='90' cy='10' r='2.5' /%3E%3Ccircle cx='10' cy='90' r='2.5' /%3E%3Ccircle cx='90' cy='90' r='2.5' /%3E%3Ccircle cx='70' cy='50' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='50' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='50' cy='30' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='50' cy='70' r='3' fill='white' stroke='%23cbd5e1' stroke-width='1.5'/%3E%3Ccircle cx='10' cy='50' r='2' /%3E%3Ccircle cx='90' cy='50' r='2' /%3E%3Ccircle cx='50' cy='10' r='2' /%3E%3Ccircle cx='50' cy='90' r='2' /%3E%3C/g%3E%3C/svg%3E\")",
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 35%)',
            maskImage: 'linear-gradient(to top, black 0%, transparent 35%)',
          }}
        ></div>

        {/* Lateral Frame / Brand Colors */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-blue-900 z-10"></div>
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-amber-500 z-10"></div>

        <div className="flex flex-col items-center justify-center w-full max-w-2xl text-center space-y-8 z-20 relative text-[16px]">
          <div className="flex items-center justify-center h-28 mb-4 w-full">
            <img src={logoImg} alt="Eletroteste Logo" className="max-h-full object-contain" />
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <Cpu className="w-12 h-12 text-blue-900 stroke-[1.5]" />
            <h1 className="text-[18px] font-semibold text-slate-900 uppercase leading-snug tracking-tight text-center">
              LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA EM CABINE PRIMÁRIA
            </h1>
          </div>

          <div className="w-24 h-1 bg-blue-900 my-8 rounded-full"></div>

          <div className="w-full text-center space-y-8 mt-8">
            <div>
              <p className="text-[16px] font-medium text-slate-500 uppercase tracking-widest mb-2 leading-none">
                Cliente
              </p>
              <p className="text-[16px] font-semibold text-slate-800 leading-none">
                {cliente.nome_empresa || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[16px] font-medium text-slate-500 uppercase tracking-widest mb-2 leading-none mt-6">
                Relatório Nº
              </p>
              <p className="text-[16px] font-semibold text-slate-800 leading-none">
                {report.numero_relatorio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="px-8 pb-8 max-w-[210mm] mx-auto text-[12px] print:max-w-none print:pt-0 print:px-12 print:pb-0 font-sans bg-white shadow-xl print:shadow-none relative z-10">
        <table className="w-full">
          <thead className="table-header-group">
            <tr>
              <td>
                {/* Technical Header (Carimbo) */}
                <div className="print:mt-8 border-t-[6px] border-blue-900 pb-2 mb-6">
                  <table className="w-full border-collapse border border-slate-800 mt-2 bg-white">
                    <tbody>
                      <tr>
                        <td className="border border-slate-800 w-[25%] p-3 align-middle text-center">
                          <div className="flex items-center justify-center h-full min-h-[4rem]">
                            <img
                              src={logoImg}
                              alt="Eletroteste Logo"
                              className="max-h-12 w-auto object-contain"
                            />
                          </div>
                        </td>
                        <td className="border border-slate-800 w-[50%] p-3 text-center align-middle">
                          <div className="font-semibold text-[14px] text-slate-900 uppercase tracking-tight leading-snug">
                            <div>LAUDO TÉCNICO DE MANUTENÇÃO</div>
                            <div>PREVENTIVA EM CABINE PRIMÁRIA</div>
                          </div>
                          <div className="text-[12px] text-slate-600 mt-1.5 font-medium">
                            Normas de Referência: NBR 14039 / NBR 5410
                          </div>
                        </td>
                        <td className="border border-slate-800 w-[25%] p-3 align-middle text-slate-800 text-center bg-slate-50">
                          <strong className="text-slate-500 block text-[12px] uppercase tracking-widest mb-1 font-medium">
                            Relatório Nº
                          </strong>
                          <span className="font-semibold text-[14px] text-blue-900 leading-none">
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
                <div className="mb-6 avoid-break text-[12px]">
                  <div className="bg-slate-800 text-white p-2 font-medium mb-2 uppercase text-[13px] tracking-wider">
                    Dados do Cliente e Relatório
                  </div>
                  <table className="w-full border-collapse border border-slate-300">
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
                          Empresa
                        </td>
                        <td className="border border-slate-300 p-2 w-3/4 font-semibold text-slate-900">
                          {cliente.nome_empresa || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          CNPJ
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900">
                          {cliente.cnpj || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Endereço
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900">
                          {cliente.endereco || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Nº Relatório
                        </td>
                        <td className="border border-slate-300 p-2 font-semibold text-blue-900">
                          {report.numero_relatorio}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Nº Proposta
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900">
                          {report.numero_proposta || 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Execution Info */}
                <div className="mb-8 avoid-break text-[12px]">
                  <div className="bg-slate-800 text-white p-2 font-medium mb-2 uppercase text-[13px] tracking-wider">
                    Dados da Execução
                  </div>
                  <table className="w-full border-collapse border border-slate-300">
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
                          Data Início
                        </td>
                        <td className="border border-slate-300 p-2 w-1/4 text-slate-900">
                          {formatDate(report.data_execucao)}
                        </td>
                        <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
                          Data Fim
                        </td>
                        <td className="border border-slate-300 p-2 w-1/4 text-slate-900">
                          {formatDate(report.data_fim)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Próxima Manutenção
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900">
                          {formatDate(report.proxima_manutencao)}
                        </td>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Responsável Técnico
                        </td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                          {autor.name || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Temp. Ambiente
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900">
                          {report.temperatura_ambiente !== undefined &&
                          report.temperatura_ambiente !== null &&
                          report.temperatura_ambiente !== ''
                            ? `${formatNumberPtBR(report.temperatura_ambiente, 1, 1)} °C`
                            : 'N/A'}
                        </td>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Umidade Relativa
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900">
                          {report.umidade_relativa !== undefined &&
                          report.umidade_relativa !== null &&
                          report.umidade_relativa !== ''
                            ? `${formatNumberPtBR(report.umidade_relativa, 1, 1)} %`
                            : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                          Acompanhante
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-900" colSpan={3}>
                          {report.acompanhante || 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Equipments Body */}
                {equipments.map((eq: any, i: number) => {
                  const isTransformador = eq.tipo_equipamento === 'Transformador'
                  const containerSpace = isTransformador ? 'space-y-3' : 'space-y-6'
                  const sectionMargin = isTransformador ? 'mt-4' : 'mt-8'
                  const textSize = isTransformador ? 'text-[11px]' : 'text-[12px]'
                  const tablePadding = isTransformador ? 'p-1.5' : 'p-3'

                  return (
                    <div
                      key={eq.id}
                      className="mb-8 break-before-page border border-slate-400 bg-white text-[12px]"
                    >
                      <div className="bg-slate-200 text-slate-900 p-3 font-semibold text-[14px] border-b border-slate-400 uppercase tracking-wide">
                        {i + 1}. EQUIPAMENTO: {eq.tipo_equipamento}
                      </div>

                      <div className={`p-4 ${containerSpace}`}>
                        {/* Technical Data */}
                        {eq.dados_tecnicos && Object.keys(eq.dados_tecnicos).length > 0 && (
                          <div>
                            <div className="font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-[13px] uppercase tracking-wider">
                              Características Técnicas
                            </div>
                            <div
                              className={`grid grid-cols-3 gap-x-4 ${isTransformador ? 'gap-y-1' : 'gap-y-2'}`}
                            >
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
                                    <div className="text-[12px] text-slate-500 italic col-span-3">
                                      Nenhuma característica preenchida.
                                    </div>
                                  )
                                }

                                return allData.map(({ key, label, value }) => (
                                  <div
                                    key={key}
                                    className={`flex items-baseline ${textSize} border-b border-slate-100 pb-1`}
                                  >
                                    <span className="font-medium text-slate-600 whitespace-nowrap pr-2 leading-tight">
                                      {label}:
                                    </span>
                                    <span className="text-slate-900 break-words leading-tight">
                                      {typeof value === 'boolean'
                                        ? value
                                          ? 'Sim'
                                          : 'Não'
                                        : typeof value === 'number'
                                          ? formatNumberPtBR(value)
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
                          <div className={sectionMargin}>
                            <div className="font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-[13px] uppercase tracking-wider">
                              Resultados dos Testes
                            </div>
                            <div className="border border-slate-200 rounded overflow-hidden">
                              <table className={`w-full ${textSize} border-collapse`}>
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th
                                      className={`${tablePadding} text-left text-slate-700 font-medium w-[15%] border-r border-slate-200 whitespace-nowrap`}
                                    >
                                      Data
                                    </th>
                                    <th
                                      className={`${tablePadding} text-left text-slate-700 font-medium w-[30%] border-r border-slate-200 whitespace-nowrap`}
                                    >
                                      Teste Realizado
                                    </th>
                                    <th
                                      className={`${tablePadding} text-left text-slate-700 font-medium w-[55%]`}
                                    >
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
                                          <td
                                            className={`${tablePadding} align-top border-r border-slate-200 font-medium whitespace-nowrap text-slate-900`}
                                          >
                                            {formatDate(t.data_teste)}
                                          </td>
                                          <td
                                            className={`${tablePadding} align-top border-r border-slate-200 whitespace-nowrap text-slate-900`}
                                          >
                                            {t.tipo_teste}
                                          </td>
                                          <td
                                            className={`${tablePadding} align-top text-blue-900 font-semibold whitespace-pre-wrap`}
                                          >
                                            {resultsStr}
                                          </td>
                                        </tr>
                                        <tr className="avoid-break bg-slate-50/50 border-t border-slate-200">
                                          <td
                                            colSpan={3}
                                            className={`${isTransformador ? 'px-1.5 py-1' : 'px-3 py-2'} text-slate-600`}
                                          >
                                            <span className="font-medium">
                                              Equipamento Utilizado:
                                            </span>{' '}
                                            {t.equipamento_utilizado}
                                          </td>
                                        </tr>
                                        {hasObservacao && (
                                          <tr className="avoid-break bg-yellow-50/50 border-t border-slate-200">
                                            <td
                                              colSpan={3}
                                              className={`${isTransformador ? 'px-1.5 py-1' : 'px-3 py-2'} text-slate-700 italic`}
                                            >
                                              <span className="font-medium not-italic">
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
                          <div className={sectionMargin}>
                            <div className="font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-[13px] uppercase tracking-wider">
                              Parecer Técnico Específico
                            </div>
                            <div
                              className={`border-l-4 border-slate-400 pl-4 py-2 bg-slate-50 ${isTransformador ? 'space-y-1' : 'space-y-2'}`}
                            >
                              <div className={`flex items-center gap-2 mb-2 ${textSize}`}>
                                <span className="font-medium text-slate-700">Status:</span>
                                <span
                                  className={`font-semibold uppercase px-2 py-1 rounded ${textSize} ${
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
                                <div className={textSize}>
                                  <span className="font-medium text-slate-700 block mb-0.5">
                                    Justificativa da Mudança:
                                  </span>
                                  <span
                                    className={`text-slate-900 block bg-white ${isTransformador ? 'p-1.5' : 'p-2'} border border-slate-200 rounded`}
                                  >
                                    {eq.parecer.justificativa_mudanca}
                                  </span>
                                </div>
                              )}
                              {eq.parecer.observacoes && (
                                <div className={textSize}>
                                  <span className="font-medium text-slate-700 block mb-0.5">
                                    Observações:
                                  </span>
                                  <span
                                    className={`text-slate-900 block whitespace-pre-wrap bg-white ${isTransformador ? 'p-1.5' : 'p-2'} border border-slate-200 rounded`}
                                  >
                                    {eq.parecer.observacoes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Photos */}
                        {eq.fotos && eq.fotos.length > 0 && (
                          <div className={`avoid-break ${sectionMargin}`}>
                            <div className="font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1 text-[13px] uppercase tracking-wider">
                              REGISTRO FOTOGRÁFICO
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {eq.fotos.map((foto: string) => (
                                <img
                                  key={foto}
                                  src={pb.files.getURL(eq, foto)}
                                  alt="Equipamento"
                                  className="w-full h-64 object-contain border border-slate-300 rounded shadow-sm avoid-break bg-slate-50 p-2"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* General Photos (Estrutura) */}
                {report.fotos_estrutura && report.fotos_estrutura.length > 0 && (
                  <div className="mb-8 break-before-page avoid-break border border-slate-400 bg-white p-4">
                    <div className="font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1 text-[13px] uppercase tracking-wider">
                      REGISTRO FOTOGRÁFICO - GERAL / ESTRUTURA
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      {report.fotos_estrutura.map((foto: string) => (
                        <img
                          key={foto}
                          src={pb.files.getURL(report, foto)}
                          alt="Estrutura"
                          className="w-full h-72 object-contain border border-slate-300 rounded shadow-sm avoid-break bg-slate-50 p-2"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Conclusion */}
                {(report.parecer_geral || report.observacoes) && (
                  <div className="mb-8 avoid-break border-2 border-slate-800 rounded-sm mt-10">
                    <div className="bg-slate-800 text-white p-3 font-medium text-[13px] tracking-wide text-center uppercase">
                      Conclusão Geral e Parecer Técnico
                    </div>
                    <div className="p-6 space-y-6 bg-slate-50 text-[12px]">
                      {report.parecer_geral && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3 uppercase text-[13px] tracking-wider border-b border-slate-300 pb-1">
                            Parecer Final
                          </h4>
                          <p className="text-slate-900 whitespace-pre-wrap leading-relaxed bg-white p-4 border border-slate-200 rounded">
                            {report.parecer_geral}
                          </p>
                        </div>
                      )}
                      {report.observacoes && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3 uppercase text-[13px] tracking-wider border-b border-slate-300 pb-1 mt-6">
                            Observações Adicionais
                          </h4>
                          <p className="text-slate-900 whitespace-pre-wrap leading-relaxed italic bg-white p-4 border border-slate-200 rounded">
                            {report.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Signature Line */}
                <div className="mt-16 pt-8 pb-8 flex justify-center avoid-break">
                  <div className="w-80 text-center text-[12px]">
                    <div className="border-t border-black pt-3 font-semibold text-slate-900">
                      {autor.name || 'Responsável Técnico'}
                    </div>
                    <div className="text-slate-600 mt-1 font-medium">
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
                <div className="print:mb-4 mt-8 border-t-2 border-slate-800 pt-4 text-[11px] text-slate-600 bg-white leading-relaxed">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <span>
                        <strong className="font-medium">CNPJ:</strong> 64.941.818/0001-91
                        &nbsp;|&nbsp; <strong className="font-medium">IE:</strong> 748.001.165.111
                        &nbsp;|&nbsp; <strong className="font-medium">IM:</strong> 688
                      </span>
                      <span>Rua Andradina, 262 - Remanso Campineiro - Hortolândia - SP</span>
                    </div>
                    <div className="flex flex-col text-right gap-1">
                      <span>
                        <strong className="font-medium">Tels:</strong> (19) 3865-2942 / 3865-1261
                        &nbsp;|&nbsp; <strong className="font-medium">WhatsApp:</strong> (19) 9
                        7143-3853
                      </span>
                      <span>
                        <strong className="font-medium">Site:</strong> www.eletroteste.com
                        &nbsp;|&nbsp; <strong className="font-medium">E-mail:</strong>{' '}
                        eletroteste@eletroteste.com
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
