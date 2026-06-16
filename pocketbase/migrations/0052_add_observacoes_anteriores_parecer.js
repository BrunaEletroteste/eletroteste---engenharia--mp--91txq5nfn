migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('parecer_tecnico')
    col.fields.add(
      new TextField({
        name: 'observacoes_anteriores',
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('parecer_tecnico')
    col.fields.removeByName('observacoes_anteriores')
    app.save(col)
  },
)
