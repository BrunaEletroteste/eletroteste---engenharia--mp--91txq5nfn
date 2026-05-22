export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  dependsOn?: { field: string; value: any }
}

export const EQUIPMENT_TYPES = [
  'Cabo',
  'Para-raio',
  'Transformador de Potencial',
  'Transformador de Corrente',
  'Seccionadora',
  'Transformador',
  'Disjuntor',
  'Relé',
]

export const getEquipmentFields = (type: string): FieldDef[] => {
  const common: FieldDef[] = [
    { name: 'subestacao', label: 'Subestação', type: 'text' },
    { name: 'numero', label: 'Número', type: 'text' },
  ]

  switch (type) {
    case 'Transformador de Potencial':
      return [
        ...common,
        { name: 'marca', label: 'Marca', type: 'text' },
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'tensao_primaria', label: 'Tensão Primária (V)', type: 'number' },
        { name: 'tensao_secundaria', label: 'Tensão Secundária (V)', type: 'number' },
        { name: 'potencia', label: 'Potência (VA)', type: 'number' },
        { name: 'relacao', label: 'Relação', type: 'text' },
      ]
    case 'Transformador de Corrente':
      return [
        ...common,
        { name: 'marca', label: 'Marca', type: 'text' },
        { name: 'tensao_primaria', label: 'Tensão Primária (V)', type: 'number' },
        { name: 'classe_precisao', label: 'Classe de Precisão', type: 'text' },
        { name: 'relacao', label: 'Relação', type: 'text' },
        { name: 'corrente_primaria', label: 'Corrente Primária (A)', type: 'number' },
        { name: 'corrente_secundaria', label: 'Corrente Secundária (A)', type: 'number' },
      ]
    case 'Seccionadora':
      return [
        ...common,
        { name: 'circuito', label: 'Circuito', type: 'text' },
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'corrente_nominal', label: 'Corrente Nominal (A)', type: 'number' },
        { name: 'classe_isolamento', label: 'Classe de Isolamento (kV)', type: 'number' },
        { name: 'fabricante', label: 'Fabricante', type: 'text' },
        { name: 'possui_fusivel', label: 'Possui fusível?', type: 'boolean' },
        {
          name: 'fusivel_tipo',
          label: 'Fusível - Tipo',
          type: 'text',
          dependsOn: { field: 'possui_fusivel', value: true },
        },
        {
          name: 'fusivel_corrente_nominal',
          label: 'Fusível - Corrente Nominal (A)',
          type: 'number',
          dependsOn: { field: 'possui_fusivel', value: true },
        },
        {
          name: 'fusivel_fabricante',
          label: 'Fusível - Fabricante',
          type: 'text',
          dependsOn: { field: 'possui_fusivel', value: true },
        },
      ]
    case 'Transformador':
      return [
        ...common,
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'potencia', label: 'Potência (kVA)', type: 'number' },
        { name: 'classe_isolamento', label: 'Classe de Isolamento (kV)', type: 'number' },
        { name: 'tap_at', label: 'Tap de AT (V)', type: 'number' },
        { name: 'tensao_secundaria', label: 'Tensão Secundária (V)', type: 'number' },
        { name: 'corrente_primaria', label: 'Corrente Primária (A)', type: 'number' },
        { name: 'corrente_secundaria', label: 'Corrente Secundária (A)', type: 'number' },
        { name: 'impedancia', label: 'Impedância (%)', type: 'number' },
        { name: 'condut_vs', label: 'Condut. de Vs (mm²)', type: 'number' },
        {
          name: 'meio_isolante',
          label: 'Meio Isolante',
          type: 'select',
          options: ['Óleo Mineral', 'Epóxi'],
        },
        { name: 'volume_oleo', label: 'Volume de Óleo (L)', type: 'number' },
        { name: 'peso_total', label: 'Peso Total (kg)', type: 'number' },
        { name: 'fabricante', label: 'Fabricante', type: 'text' },
        { name: 'buchas', label: 'Buchas de AT e BT', type: 'select', options: ['Sim', 'Não'] },
        { name: 'desl_angular', label: 'Desl. Angular', type: 'text' },
        { name: 'ligado_em', label: 'Ligado em (V)', type: 'number' },
        { name: 'diagrama', label: 'Diagrama', type: 'text' },
      ]
    case 'Disjuntor':
      return [
        ...common,
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'fabricante', label: 'Fabricante', type: 'text' },
        { name: 'corrente_nominal', label: 'Corrente Nominal (A)', type: 'number' },
        { name: 'classe_isolamento', label: 'Classe de Isolamento (kV)', type: 'number' },
        { name: 'potencia_simetrica', label: 'Potência Simétrica (MVA)', type: 'number' },
        { name: 'capacidade_ruptura', label: 'Capacidade de Ruptura (kA)', type: 'number' },
        { name: 'rele_minima_tensao', label: 'Relé de Mínima Tensão', type: 'text' },
        { name: 'rele_abertura', label: 'Relé de Abertura', type: 'text' },
        { name: 'rele_fechamento', label: 'Relé de Fechamento', type: 'text' },
        { name: 'motorizacao', label: 'Motorização', type: 'text' },
        { name: 'rele_supervisor', label: 'Relé Supervisor Trifásico', type: 'text' },
      ]
    case 'Cabo':
    case 'Para-raio':
    case 'Relé':
    default:
      return [
        ...common,
        { name: 'marca', label: 'Marca', type: 'text' },
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'fabricante', label: 'Fabricante', type: 'text' },
      ]
  }
}
