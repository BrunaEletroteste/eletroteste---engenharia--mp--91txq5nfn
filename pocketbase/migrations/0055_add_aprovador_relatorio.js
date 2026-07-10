migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    if (!col.fields.getByName('aprovador_relatorio')) {
      col.fields.add(
        new TextField({
          name: 'aprovador_relatorio',
          required: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.removeByName('aprovador_relatorio')
    app.save(col)
  },
)
