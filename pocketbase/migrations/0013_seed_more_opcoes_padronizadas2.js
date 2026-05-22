migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    const options = [
      { categoria: 'tensao_primaria', valor: '15.000' },
      { categoria: 'tensao_primaria', valor: '11.900' },
      { categoria: 'classe_precisao', valor: '10B100' },
    ]

    for (const opt of options) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          'categoria = {:categoria} && valor = {:valor}',
          { categoria: opt.categoria, valor: opt.valor },
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
      { categoria: 'tensao_primaria', valor: '15.000' },
      { categoria: 'tensao_primaria', valor: '11.900' },
      { categoria: 'classe_precisao', valor: '10B100' },
    ]
    for (const opt of options) {
      try {
        const record = app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          'categoria = {:categoria} && valor = {:valor}',
          { categoria: opt.categoria, valor: opt.valor },
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
