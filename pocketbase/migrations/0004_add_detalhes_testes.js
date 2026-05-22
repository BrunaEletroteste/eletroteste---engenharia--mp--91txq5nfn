migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    col.fields.add(
      new JSONField({
        name: 'dados_detalhados',
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    col.fields.removeByName('dados_detalhados')
    app.save(col)
  },
)
