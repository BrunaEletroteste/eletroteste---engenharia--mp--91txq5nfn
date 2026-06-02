migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    if (!col.fields.getByName('obra')) {
      col.fields.add(new TextField({ name: 'obra', required: false }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    if (col.fields.getByName('obra')) {
      col.fields.removeByName('obra')
    }
    app.save(col)
  },
)
