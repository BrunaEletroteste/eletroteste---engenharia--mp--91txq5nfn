/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    const field = col.fields.getByName('tipo_laudo')
    if (field) {
      field.values = ['PREVENTIVA', 'PREVENTIVA_CORRETIVA', 'COMISSIONAMENTO_RAMAL_AEREO_25KV']
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    const field = col.fields.getByName('tipo_laudo')
    if (field) {
      field.values = ['PREVENTIVA', 'PREVENTIVA_CORRETIVA']
      app.save(col)
    }
  },
)
