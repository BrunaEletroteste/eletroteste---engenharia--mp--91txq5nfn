migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    const options = [
      { categoria: 'classe_isolamento', valor: '15' },
      { categoria: 'classe_isolamento', valor: '15/1,2' },
      { categoria: 'classe_isolamento', valor: '17,5' },
      { categoria: 'classe_isolamento', valor: '34/3' },
      { categoria: 'potencia_simetrica', valor: 'N/A' },
      { categoria: 'capacidade_ruptura', valor: 'N/A' },
      { categoria: 'capacidade_ruptura', valor: '25' },
      { categoria: 'rele_minima_tensao', valor: 'N/A' },
      { categoria: 'rele_minima_tensao', valor: '220' },
      { categoria: 'rele_abertura', valor: 'N/A' },
      { categoria: 'rele_abertura', valor: '220' },
      { categoria: 'rele_fechamento', valor: 'N/A' },
      { categoria: 'rele_fechamento', valor: '220' },
      { categoria: 'motorizacao', valor: 'N/A' },
      { categoria: 'motorizacao', valor: '220' },
    ]

    for (const opt of options) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          `categoria='${opt.categoria}' && valor='${opt.valor}'`,
        )
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', opt.categoria)
        record.set('valor', opt.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const options = [
      { categoria: 'classe_isolamento', valor: '15' },
      { categoria: 'classe_isolamento', valor: '15/1,2' },
      { categoria: 'classe_isolamento', valor: '17,5' },
      { categoria: 'classe_isolamento', valor: '34/3' },
      { categoria: 'potencia_simetrica', valor: 'N/A' },
      { categoria: 'capacidade_ruptura', valor: 'N/A' },
      { categoria: 'capacidade_ruptura', valor: '25' },
      { categoria: 'rele_minima_tensao', valor: 'N/A' },
      { categoria: 'rele_minima_tensao', valor: '220' },
      { categoria: 'rele_abertura', valor: 'N/A' },
      { categoria: 'rele_abertura', valor: '220' },
      { categoria: 'rele_fechamento', valor: 'N/A' },
      { categoria: 'rele_fechamento', valor: '220' },
      { categoria: 'motorizacao', valor: 'N/A' },
      { categoria: 'motorizacao', valor: '220' },
    ]

    for (const opt of options) {
      try {
        const record = app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          `categoria='${opt.categoria}' && valor='${opt.valor}'`,
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
