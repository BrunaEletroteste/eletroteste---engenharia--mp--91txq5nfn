migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.add(new TextField({ name: 'numero_proposta' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.removeByName('numero_proposta')
    app.save(col)
  },
)
