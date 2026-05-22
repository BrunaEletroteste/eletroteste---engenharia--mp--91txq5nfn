migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.add(
      new FileField({
        name: 'anexos',
        maxSelect: 10,
        maxSize: 10485760, // 10MB
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.removeByName('anexos')
    app.save(col)
  },
)
