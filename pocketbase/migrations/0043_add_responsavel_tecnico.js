migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.add(
      new TextField({
        name: 'responsavel_tecnico',
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.removeByName('responsavel_tecnico')
    app.save(col)
  },
)
