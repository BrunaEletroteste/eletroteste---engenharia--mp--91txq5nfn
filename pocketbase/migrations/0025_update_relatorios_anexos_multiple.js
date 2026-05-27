migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.add(
      new FileField({
        name: 'anexos',
        maxSelect: 99,
        maxSize: 10485760, // 10MB
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.add(
      new FileField({
        name: 'anexos',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: [],
      }),
    )
    app.save(col)
  },
)
