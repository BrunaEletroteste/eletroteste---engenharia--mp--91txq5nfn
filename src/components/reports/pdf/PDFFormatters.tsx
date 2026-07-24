import React from 'react'
import { formatNumberPtBR } from '@/lib/format'
import { getEquipmentFields } from '@/lib/equipment-templates'

export const labelMap: Record<string, string> = {
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
  duplo_secundario: 'Duplo Secundário?',
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
  corrente_ajuste_longo: 'Corrente de Ajuste Longo (A)',
  temporizacao_longo: 'Temporização Longo (s)',
  corrente_ajuste_curto: 'Corrente de Ajuste Curto (A)',
  temporizacao_curto: 'Temporização Curto (s)',
  corrente_ajuste_instantanea: 'Corrente de Ajuste Instantânea (A)',
}

export const getLabel = (key: string, tipoEquipamento?: string) => {
  if (tipoEquipamento) {
    const field = getEquipmentFields(tipoEquipamento).find((f) => f.name === key)
    if (field) return field.label
  }
  return (
    labelMap[key.toLowerCase()] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  )
}

export const formatDate = (dateStr: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-'

export const renderLaudoTitle = (tipo?: string) =>
  tipo === 'PREVENTIVA_CORRETIVA' ? (
    <React.Fragment>
      <span className="block">LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA</span>
      <span className="block">E CORRETIVA EM CABINE(S) PRIMÁRIA(S)</span>
    </React.Fragment>
  ) : (
    'LAUDO TÉCNICO DE MANUTENÇÃO PREVENTIVA EM CABINE(S) PRIMÁRIA(S)'
  )

export const formatTestValue = (t: any, tipoEquipamento: string, subType?: string): string[] => {
  const formatNum = (val: any, isRelacao = false) => {
    if (val === undefined || val === null || val === '') return '-'
    const num =
      typeof val === 'string'
        ? Number(
            val.includes(',') ? val.replace(/\./g, '').replace(',', '.') : val.replace(/\./g, ''),
          )
        : val
    if (typeof num === 'number' && !isNaN(num)) {
      const numStr = isRelacao ? formatNumberPtBR(num, 3, 3) : formatNumberPtBR(num, 4)
      return t.unidade && t.unidade !== '-' ? `${numStr} ${t.unidade}` : numStr
    }
    return val === '-' ? val : t.unidade && t.unidade !== '-' ? `${val} ${t.unidade}` : String(val)
  }

  const parseLocalNum = (v: any) =>
    typeof v === 'string'
      ? Number(v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v.replace(/\./g, ''))
      : v
  if (t.tipo_teste === 'Resistências dos Isolamentos') {
    if (tipoEquipamento === 'Condutor Elétrico') {
      const d = t.dados_detalhados || {}
      const calc = (f: any) =>
        f?.resultado !== undefined
          ? formatNum(f.resultado)
          : f?.v1 && f?.v2
            ? formatNum(parseLocalNum(f.v1) * parseLocalNum(f.v2))
            : '-'
      const items = [`A: ${calc(d.fase_a)}`, `B: ${calc(d.fase_b)}`, `C: ${calc(d.fase_c)}`]
      const rRaw = d.reserva
      if (rRaw && rRaw !== '' && rRaw !== '0') items.push(`R: ${calc(rRaw)}`)
      return items
    } else if (
      tipoEquipamento === 'Transformador de Potencial' ||
      tipoEquipamento === 'Transformador de Corrente'
    ) {
      const d = t.dados_detalhados?.fases || {}
      const calc = (f: any) =>
        f?.resultado !== undefined
          ? formatNum(f.resultado)
          : f?.valor1 && f?.valor2
            ? formatNum(parseLocalNum(f.valor1) * parseLocalNum(f.valor2))
            : '-'
      return [`A: ${calc(d.A)}`, `B: ${calc(d.B)}`, `C: ${calc(d.C)}`]
    } else if (tipoEquipamento === 'Disjuntor') {
      const df = t.dados_detalhados?.fechado || {},
        da = t.dados_detalhados?.aberto || {}
      const calc = (f: any) =>
        f?.resultado !== undefined
          ? formatNum(f.resultado)
          : f?.v1 && f?.v2
            ? formatNum(parseLocalNum(f.v1) * parseLocalNum(f.v2))
            : '-'
      const fechado = [
        `A x B: ${calc(df.ab)}`,
        `B x C: ${calc(df.bc)}`,
        `C x A: ${calc(df.ac)}`,
        `A, B, C x Massa: ${calc(df.abc_massa)}`,
      ]
      const aberto = [`A x A: ${calc(da.aa)}`, `B x B: ${calc(da.bb)}`, `C x C: ${calc(da.cc)}`]
      return [
        'Fechado:',
        ...fechado.map((i) => `  ${i}`),
        'Aberto:',
        ...aberto.map((i) => `  ${i}`),
      ]
    } else if (tipoEquipamento === 'Transformador') {
      const m = t.dados_detalhados?.medicoes || t.dados_detalhados || {}
      const calc = (f: any) =>
        f?.resultado !== undefined
          ? formatNum(f.resultado)
          : f?.v1 && f?.v2
            ? formatNum(parseLocalNum(f.v1) * parseLocalNum(f.v2))
            : '-'
      return [
        `A/B: ${calc(m.alta_baixa)}`,
        `A/M: ${calc(m.alta_massa)}`,
        `B/M: ${calc(m.baixa_massa)}`,
      ]
    } else {
      const d = t.dados_detalhados || {}
      const calc = (f: any) => formatNum((parseLocalNum(f?.v1) || 0) * (parseLocalNum(f?.v2) || 0))
      return [
        `A x B: ${calc(d.ab)}`,
        `B x C: ${calc(d.bc)}`,
        `C x A: ${calc(d.ac)}`,
        `A, B, C x Massa: ${calc(d.abc_massa)}`,
      ]
    }
  }

  if (t.tipo_teste === 'Resistências dos Enrolamentos') {
    const ets = t.dados_detalhados?.ets || {},
      eti = t.dados_detalhados?.eti || {}
    const fField = (v: any, u: string) => (v ? `${formatNumberPtBR(v, 2, 2)} ${u}` : '-')
    const f_ets = [
      `H1-H3: ${fField(ets.h1_h3, 'Ω')}`,
      `H2-H1: ${fField(ets.h2_h1, 'Ω')}`,
      `H3-H2: ${fField(ets.h3_h2, 'Ω')}`,
    ]
    const f_eti = [
      `X1-X3: ${fField(eti.x1_x3, 'mΩ')}`,
      `X2-X1: ${fField(eti.x2_x1, 'mΩ')}`,
      `X3-X2: ${fField(eti.x3_x2, 'mΩ')}`,
    ]
    return ['ETS:', ...f_ets.map((i) => `  ${i}`), 'ETI:', ...f_eti.map((i) => `  ${i}`)]
  }

  if (t.tipo_teste === 'Resistências dos Contatos') {
    const d = t.dados_detalhados || {}
    return [`A: ${formatNum(d.fase_a)}`, `B: ${formatNum(d.fase_b)}`, `C: ${formatNum(d.fase_c)}`]
  }

  if (t.tipo_teste === 'Relação de Tensões' && tipoEquipamento === 'Transformador') {
    const d = t.dados_detalhados || {}
    return [
      `Posição: ${d.posicao || '-'}`,
      `H1H3/X0X1: ${formatNum(d.h1h3_x0x1, true)}`,
      `H2H1/X0X2: ${formatNum(d.h2h1_x0x2, true)}`,
      `H3H2/X0X3: ${formatNum(d.h3h2_x0x3, true)}`,
    ]
  }

  return [`${formatNum(t.valor_teste)}`]
}

export const formatEstruturaNumeric = (value: any): string => {
  if (value === undefined || value === null || value === '') return String(value)
  const num =
    typeof value === 'string'
      ? Number(
          value.includes(',')
            ? value.replace(/\./g, '').replace(',', '.')
            : value.replace(/\./g, ''),
        )
      : value
  if (typeof num === 'number' && !isNaN(num)) {
    return formatNumberPtBR(num, 1, 1)
  }
  return String(value)
}

const parsePtBRValue = (value: any): number | null => {
  if (typeof value === 'number') return isNaN(value) ? null : value
  if (typeof value === 'string' && value.trim() !== '') {
    const cleanStr = value.includes(',')
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/\./g, '')
    const num = Number(cleanStr)
    return isNaN(num) ? null : num
  }
  return null
}

export const formatEquipmentValue = (value: any, key: string, tipoEquipamento: string): string => {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'

  if (
    tipoEquipamento === 'Estrutura' &&
    (key === 'temperatura_ambiente' || key === 'umidade_relativa')
  ) {
    return formatEstruturaNumeric(value)
  }

  if (tipoEquipamento === 'Transformador' && key === 'impedancia') {
    const num = parsePtBRValue(value)
    if (num !== null) return formatNumberPtBR(num, 2, 2)
    return String(value)
  }

  if (tipoEquipamento === 'QGBT' && key !== 'subestacao') {
    const num = parsePtBRValue(value)
    if (num !== null) {
      if (
        ['corrente_ajuste_longo', 'corrente_ajuste_curto', 'corrente_ajuste_instantanea'].includes(
          key,
        )
      ) {
        return formatNumberPtBR(num, 0, 0)
      }
      if (['temporizacao_longo', 'temporizacao_curto'].includes(key)) {
        return formatNumberPtBR(num, 1, 1)
      }
      if (
        [
          'numero',
          'corrente_nominal',
          'rele_minima_tensao',
          'rele_abertura',
          'rele_fechamento',
          'motorizacao',
        ].includes(key)
      ) {
        return formatNumberPtBR(num, 0, 0)
      }
      return formatNumberPtBR(num, 2, 2)
    }
  }

  if (typeof value === 'number') return formatNumberPtBR(value)
  return String(value)
}
