migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')
    try {
      app.findFirstRecordByFilter(
        'opcoes_padronizadas',
        "categoria = 'Isolação' && valor = {:val}",
        { val: 'NU' },
      )
    } catch (_) {
      const record = new Record(col)
      record.set('categoria', 'Isolação')
      record.set('valor', 'NU')
      app.save(record)
    }
  },
  (app) => {
    app
      .db()
      .newQuery("DELETE FROM opcoes_padronizadas WHERE categoria = 'Isolação' && valor = 'NU'")
      .execute()
  },
)
