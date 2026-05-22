migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    col.fields.add(
      new TextField({
        name: 'observacoes',
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    col.fields.removeByName('observacoes')
    app.save(col)
  },
)
