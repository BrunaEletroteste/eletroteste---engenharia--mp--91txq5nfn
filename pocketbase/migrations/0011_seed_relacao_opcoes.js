migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')
    const opcoes = [
      { categoria: 'relacao', valor: '13.800 / 220' },
      { categoria: 'relacao', valor: '13.800 / 380' },
      { categoria: 'relacao', valor: '13.800 / 440' },
    ]

    for (const op of opcoes) {
      const existing = app.findRecordsByFilter(
        'opcoes_padronizadas',
        `categoria='${op.categoria}' && valor='${op.valor}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const record = new Record(col)
        record.set('categoria', op.categoria)
        record.set('valor', op.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const opcoes = ['13.800 / 220', '13.800 / 380', '13.800 / 440']
    for (const val of opcoes) {
      const existing = app.findRecordsByFilter(
        'opcoes_padronizadas',
        `categoria='relacao' && valor='${val}'`,
        '',
        1,
        0,
      )
      if (existing.length > 0) {
        app.delete(existing[0])
      }
    }
  },
)
