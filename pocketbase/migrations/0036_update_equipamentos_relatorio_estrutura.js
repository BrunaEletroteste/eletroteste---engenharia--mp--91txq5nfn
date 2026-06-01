migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')

    if (field && !field.values.includes('Estrutura')) {
      field.values = ['Estrutura'].concat(field.values)
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')

    if (field && field.values.includes('Estrutura')) {
      field.values = field.values.filter((v) => v !== 'Estrutura')
      app.save(col)
    }
  },
)
