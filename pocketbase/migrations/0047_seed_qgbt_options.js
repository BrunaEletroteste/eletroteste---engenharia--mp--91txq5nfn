migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    const optionsToSeed = [
      { categoria: 'rele_minima_tensao', valor: 'N/A' },
      { categoria: 'rele_minima_tensao', valor: '110 Vcc' },
      { categoria: 'rele_minima_tensao', valor: '125 Vcc' },
      { categoria: 'rele_minima_tensao', valor: '220 Vca' },
      { categoria: 'rele_abertura', valor: 'N/A' },
      { categoria: 'rele_abertura', valor: '110 Vcc' },
      { categoria: 'rele_abertura', valor: '125 Vcc' },
      { categoria: 'rele_abertura', valor: '220 Vca' },
      { categoria: 'rele_fechamento', valor: 'N/A' },
      { categoria: 'rele_fechamento', valor: '110 Vcc' },
      { categoria: 'rele_fechamento', valor: '125 Vcc' },
      { categoria: 'rele_fechamento', valor: '220 Vca' },
      { categoria: 'motorizacao', valor: 'N/A' },
      { categoria: 'motorizacao', valor: '110 Vcc' },
      { categoria: 'motorizacao', valor: '125 Vcc' },
      { categoria: 'motorizacao', valor: '220 Vca' },
    ]

    for (const opt of optionsToSeed) {
      try {
        app.findFirstRecordByFilter('opcoes_padronizadas', 'categoria = {:cat} && valor = {:val}', {
          cat: opt.categoria,
          val: opt.valor,
        })
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', opt.categoria)
        record.set('valor', opt.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const optionsToSeed = [
      { categoria: 'rele_minima_tensao', valor: 'N/A' },
      { categoria: 'rele_minima_tensao', valor: '110 Vcc' },
      { categoria: 'rele_minima_tensao', valor: '125 Vcc' },
      { categoria: 'rele_minima_tensao', valor: '220 Vca' },
      { categoria: 'rele_abertura', valor: 'N/A' },
      { categoria: 'rele_abertura', valor: '110 Vcc' },
      { categoria: 'rele_abertura', valor: '125 Vcc' },
      { categoria: 'rele_abertura', valor: '220 Vca' },
      { categoria: 'rele_fechamento', valor: 'N/A' },
      { categoria: 'rele_fechamento', valor: '110 Vcc' },
      { categoria: 'rele_fechamento', valor: '125 Vcc' },
      { categoria: 'rele_fechamento', valor: '220 Vca' },
      { categoria: 'motorizacao', valor: 'N/A' },
      { categoria: 'motorizacao', valor: '110 Vcc' },
      { categoria: 'motorizacao', valor: '125 Vcc' },
      { categoria: 'motorizacao', valor: '220 Vca' },
    ]

    for (const opt of optionsToSeed) {
      try {
        const record = app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          'categoria = {:cat} && valor = {:val}',
          { cat: opt.categoria, val: opt.valor },
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
