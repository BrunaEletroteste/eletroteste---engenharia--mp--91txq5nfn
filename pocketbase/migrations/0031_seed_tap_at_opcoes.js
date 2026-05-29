migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')
    const records = app.findRecordsByFilter(
      'opcoes_padronizadas',
      "categoria='Tap de AT (V)' && valor='10.200 à 13.800'",
      '',
      1,
      0,
    )
    if (records.length === 0) {
      const record = new Record(col)
      record.set('categoria', 'Tap de AT (V)')
      record.set('valor', '10.200 à 13.800')
      app.save(record)
    }
  },
  (app) => {
    const records = app.findRecordsByFilter(
      'opcoes_padronizadas',
      "categoria='Tap de AT (V)' && valor='10.200 à 13.800'",
      '',
      1,
      0,
    )
    if (records.length > 0) {
      app.delete(records[0])
    }
  },
)
