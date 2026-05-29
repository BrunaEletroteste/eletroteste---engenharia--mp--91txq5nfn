migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    if (!col.fields.getByName('data_fim')) {
      col.fields.add(
        new DateField({
          name: 'data_fim',
          required: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    const field = col.fields.getByName('data_fim')
    if (field) {
      col.fields.removeByName('data_fim')
      app.save(col)
    }
  },
)
