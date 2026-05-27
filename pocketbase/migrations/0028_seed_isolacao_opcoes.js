migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')
    const options = ['N/ID', 'Óleo', 'Epóxi']
    for (const opt of options) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          "categoria = 'Isolação' && valor = {:val}",
          { val: opt },
        )
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', 'Isolação')
        record.set('valor', opt)
        app.save(record)
      }
    }
  },
  (app) => {
    app.db().newQuery("DELETE FROM opcoes_padronizadas WHERE categoria = 'Isolação'").execute()
  },
)
