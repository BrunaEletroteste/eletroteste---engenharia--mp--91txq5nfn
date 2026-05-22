migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')

    if (!col.fields.getByName('fotos')) {
      col.fields.add(
        new FileField({
          name: 'fotos',
          maxSelect: 30,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    col.fields.removeByName('fotos')
    app.save(col)
  },
)
