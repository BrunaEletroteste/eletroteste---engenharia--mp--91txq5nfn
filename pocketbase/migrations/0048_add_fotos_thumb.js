migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('fotos')
    if (field) {
      col.fields.add(
        new FileField({
          name: 'fotos',
          maxSelect: field.maxSelect || 99,
          maxSize: field.maxSize || 52428800,
          mimeTypes: field.mimeTypes || [],
          thumbs: ['800x0'],
          protected: field.protected || false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('fotos')
    if (field) {
      col.fields.add(
        new FileField({
          name: 'fotos',
          maxSelect: field.maxSelect || 99,
          maxSize: field.maxSize || 52428800,
          mimeTypes: field.mimeTypes || [],
          thumbs: [],
          protected: field.protected || false,
        }),
      )
      app.save(col)
    }
  },
)
