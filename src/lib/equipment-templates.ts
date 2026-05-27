export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'combobox'
  options?: string[]
  dependsOn?: { field: string; value: any }
  readOnly?: boolean
}

export const EQUIPMENT_TYPES = [
  'Cabo',
  'Para-raio de Linha',
  'Transformador de Potencial',
  'Transformador de Corrente',
  'Seccionadora',
  'Transformador',
  'Disjuntor',
  'Relé',
]

export const getEquipmentFields = (type: string): FieldDef[] => {
  const common: FieldDef[] = [
    { name: 'subestacao', label: 'Subestação', type: 'combobox' },
    { name: 'numero', label: 'Número', type: 'text' },
  ]

  switch (type) {
    case 'Transformador de Potencial':
      return [
        ...common,
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'tensao_primaria', label: 'Tensão Primária (V)', type: 'number' },
        { name: 'tensao_secundaria', label: 'Tensão Secundária (V)', type: 'number' },
        { name: 'potencia', label: 'Potência (VA)', type: 'number' },
        {
          name: 'relacao',
          label: 'Relação (Tensão Primária dividida por Tensão Secundária)',
          type: 'number',
          readOnly: true,
        },
      ]
    case 'Transformador de Corrente':
      return [
        ...common,
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
        { name: 'tensao_primaria', label: 'Tensão Primária (V)', type: 'number' },
        { name: 'classe_precisao', label: 'Classe de Precisão', type: 'text' },
        { name: 'corrente_primaria', label: 'Corrente Primária (A)', type: 'number' },
        { name: 'corrente_secundaria', label: 'Corrente Secundária (A)', type: 'number' },
        {
          name: 'relacao',
          label: 'Relação (Corrente Primária dividida por Corrente Secundária)',
          type: 'number',
          readOnly: true,
        },
      ]
    case 'Seccionadora':
      return [
        ...common,
        { name: 'circuito', label: 'Circuito', type: 'text' },
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'corrente_nominal', label: 'Corrente Nominal (A)', type: 'text' },
        { name: 'classe_isolamento', label: 'Classe de Isolamento (kV)', type: 'text' },
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
        { name: 'possui_fusivel', label: 'Contém Fusível?', type: 'boolean' },
        {
          name: 'fusivel_tipo',
          label: 'Tipo',
          type: 'text',
          dependsOn: { field: 'possui_fusivel', value: true },
        },
        {
          name: 'fusivel_corrente_nominal',
          label: 'Corrente Nominal (A)',
          type: 'number',
          dependsOn: { field: 'possui_fusivel', value: true },
        },
        {
          name: 'fusivel_fabricante',
          label: 'Fabricante dos Fusíveis',
          type: 'text',
          dependsOn: { field: 'possui_fusivel', value: true },
        },
      ]
    case 'Transformador':
      return [
        ...common,
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'potencia', label: 'Potência (kVA)', type: 'text' },
        { name: 'classe_isolamento', label: 'Classe de Isolamento (kV)', type: 'text' },
        { name: 'tap_at', label: 'Tap de AT (V)', type: 'text' },
        { name: 'tensao_secundaria', label: 'Tensão Secundária (V)', type: 'text' },
        {
          name: 'corrente_primaria',
          label: 'Corrente Primária (A)',
          type: 'number',
          readOnly: true,
        },
        {
          name: 'corrente_secundaria',
          label: 'Corrente Secundária (A)',
          type: 'number',
          readOnly: true,
        },
        { name: 'impedancia', label: 'Impedância (%)', type: 'number' },
        { name: 'condut_vs', label: 'Condut. de Vs (mm²)', type: 'text' },
        {
          name: 'meio_isolante',
          label: 'Meio Isolante',
          type: 'select',
          options: ['Óleo Mineral', 'Epóxi'],
        },
        { name: 'volume_oleo', label: 'Volume de Óleo (L)', type: 'number' },
        { name: 'peso_total', label: 'Peso Total (kg)', type: 'number' },
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
        { name: 'buchas', label: 'Buchas de AT e BT', type: 'select', options: ['Sim', 'Não'] },
        { name: 'desl_angular', label: 'Desl. Angular', type: 'text' },
        { name: 'ligado_em', label: 'Ligado em (V)', type: 'text' },
        { name: 'diagrama', label: 'Diagrama', type: 'text' },
      ]
    case 'Disjuntor':
      return [
        ...common,
        { name: 'tipo', label: 'Tipo', type: 'text' },
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
        { name: 'corrente_nominal', label: 'Corrente Nominal (A)', type: 'text' },
        { name: 'classe_isolamento', label: 'Classe de Isolamento (kV)', type: 'text' },
        { name: 'potencia_simetrica', label: 'Potência Simétrica (MVA)', type: 'text' },
        { name: 'capacidade_ruptura', label: 'Capacidade de Ruptura (kA)', type: 'text' },
        { name: 'rele_minima_tensao', label: 'Relé de Mínima Tensão', type: 'text' },
        { name: 'rele_abertura', label: 'Relé de Abertura', type: 'text' },
        { name: 'rele_fechamento', label: 'Relé de Fechamento', type: 'text' },
        { name: 'motorizacao', label: 'Motorização', type: 'text' },
        { name: 'rele_supervisor', label: 'Relé Supervisor Trifásico', type: 'text' },
      ]
    case 'Cabo':
      return [
        { name: 'subestacao', label: 'Subestação', type: 'combobox' },
        { name: 'circuito', label: 'Circuito', type: 'text' },
        {
          name: 'condutores',
          label: 'Condutores',
          type: 'select',
          options: ['01', '02', '03', '04'],
        },
        {
          name: 'secao',
          label: 'Seção',
          type: 'select',
          options: [
            'N/ID',
            '25 mm²',
            '35 mm²',
            '50 mm²',
            '70 mm²',
            '95 mm²',
            '120 mm²',
            '150 mm²',
            '185 mm²',
            '240 mm²',
            '300 mm²',
            '3 AWG',
            '2 AWG',
            '1 AWG',
            '1/0 AWG',
            '2/0 AWG',
            '3/0 AWG',
            '4/0 AWG',
          ],
        },
        {
          name: 'material_condutor',
          label: 'Material Condutor',
          type: 'select',
          options: ['N/ID', 'Cobre', 'Alumínio'],
        },
        {
          name: 'isolacao',
          label: 'Isolação',
          type: 'select',
          options: ['N/ID', 'EPR', 'HEPR', 'XLPE', 'PVC'],
        },
        { name: 'classe_isolamento', label: 'Classe de Isolamento', type: 'text' },
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
      ]
    case 'Para-raio de Linha':
      return [
        { name: 'subestacao', label: 'Subestação', type: 'combobox' },
        { name: 'circuito', label: 'Circuito', type: 'text' },
        { name: 'modelo', label: 'Modelo', type: 'select', options: ['Polimérico', 'Porcelana'] },
        { name: 'tensao_nominal', label: 'Tensão Nominal (kV)', type: 'combobox' },
        {
          name: 'corrente_descarga',
          label: 'Corrente de Descarga (kA)',
          type: 'select',
          options: ['10'],
        },
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
      ]
    case 'Relé':
    default:
      return [
        ...common,
        { name: 'fabricante', label: 'Fabricante', type: 'combobox' },
        { name: 'tipo', label: 'Tipo', type: 'text' },
      ]
  }
}
