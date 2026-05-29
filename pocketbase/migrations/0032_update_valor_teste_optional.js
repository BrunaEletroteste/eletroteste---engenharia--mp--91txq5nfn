migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    const field = col.fields.getByName('valor_teste')
    if (field) {
      field.required = false
      col.fields.add(field)
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    const field = col.fields.getByName('valor_teste')
    if (field) {
      field.required = true
      col.fields.add(field)
    }
    app.save(col)
  },
)
