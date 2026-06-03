/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')

    if (!col.fields.getByName('tipo_laudo')) {
      col.fields.add(
        new SelectField({
          name: 'tipo_laudo',
          maxSelect: 1,
          values: ['PREVENTIVA', 'PREVENTIVA_CORRETIVA'],
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    col.fields.removeByName('tipo_laudo')
    app.save(col)
  },
)
