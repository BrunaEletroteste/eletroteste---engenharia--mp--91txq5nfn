migrate(
  (app) => {
    const opcoes = [
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

    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    for (const item of opcoes) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          `categoria = '${item.categoria}' && valor = '${item.valor}'`,
        )
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', item.categoria)
        record.set('valor', item.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const opcoes = [
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

    for (const item of opcoes) {
      try {
        const record = app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          `categoria = '${item.categoria}' && valor = '${item.valor}'`,
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
