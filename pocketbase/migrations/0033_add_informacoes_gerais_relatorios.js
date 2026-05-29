migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.add(new NumberField({ name: 'temperatura_ambiente' }))
    col.fields.add(new NumberField({ name: 'umidade_relativa' }))
    col.fields.add(new TextField({ name: 'parecer_geral' }))
    col.fields.add(
      new FileField({
        name: 'fotos_estrutura',
        maxSelect: 10,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.removeByName('temperatura_ambiente')
    col.fields.removeByName('umidade_relativa')
    col.fields.removeByName('parecer_geral')
    col.fields.removeByName('fotos_estrutura')
    app.save(col)
  },
)
