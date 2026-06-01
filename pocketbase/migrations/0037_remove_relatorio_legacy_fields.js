migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('relatorios')
    collection.fields.removeByName('temperatura_ambiente')
    collection.fields.removeByName('umidade_relativa')
    collection.fields.removeByName('parecer_geral')
    collection.fields.removeByName('fotos_estrutura')
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('relatorios')

    if (!collection.fields.getByName('temperatura_ambiente')) {
      collection.fields.add(new NumberField({ name: 'temperatura_ambiente' }))
    }

    if (!collection.fields.getByName('umidade_relativa')) {
      collection.fields.add(new NumberField({ name: 'umidade_relativa' }))
    }

    if (!collection.fields.getByName('parecer_geral')) {
      collection.fields.add(new TextField({ name: 'parecer_geral' }))
    }

    if (!collection.fields.getByName('fotos_estrutura')) {
      collection.fields.add(
        new FileField({ name: 'fotos_estrutura', maxSelect: 99, maxSize: 52428800 }),
      )
    }

    app.save(collection)
  },
)
