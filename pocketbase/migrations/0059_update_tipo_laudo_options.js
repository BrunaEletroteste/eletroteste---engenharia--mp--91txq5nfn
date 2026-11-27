/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    const field = col.fields.getByName('tipo_laudo')
    if (field) {
      field.values = [
        'PREVENTIVA',
        'PREVENTIVA_CORRETIVA',
        'COMISSIONAMENTO_RAMAL_AEREO_25KV',
        'PREVENTIVA_TRANSFORMADORES',
        'PREVENTIVA_DISJUNTORES',
        'PREVENTIVA_QTA',
      ]
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios')
    const field = col.fields.getByName('tipo_laudo')
    if (field) {
      field.values = ['PREVENTIVA', 'PREVENTIVA_CORRETIVA', 'COMISSIONAMENTO_RAMAL_AEREO_25KV']
      app.save(col)
    }
  },
)
