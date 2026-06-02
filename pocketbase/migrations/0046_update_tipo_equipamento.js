migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')

    if (!field.values.includes('QGBT')) {
      field.values.push('QGBT')
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')

    const index = field.values.indexOf('QGBT')
    if (index !== -1) {
      field.values.splice(index, 1)
      app.save(col)
    }
  },
)
