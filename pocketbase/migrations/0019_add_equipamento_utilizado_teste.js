migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    if (!col.fields.getByName('equipamento_utilizado')) {
      col.fields.add(new TextField({ name: 'equipamento_utilizado', required: true }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    const field = col.fields.getByName('equipamento_utilizado')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)
