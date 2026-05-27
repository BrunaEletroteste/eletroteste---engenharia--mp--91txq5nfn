migrate(
  (app) => {
    // Update existing data first so schema validation doesn't fail
    app
      .db()
      .newQuery(
        "UPDATE equipamentos_relatorio SET tipo_equipamento = 'Para-raio de Linha' WHERE tipo_equipamento = 'Para-raio'",
      )
      .execute()

    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')
    if (field) {
      field.values = [
        'Cabo',
        'Para-raio de Linha',
        'Transformador de Potencial',
        'Transformador de Corrente',
        'Seccionadora',
        'Transformador',
        'Disjuntor',
        'Relé',
      ]
      app.save(col)
    }
  },
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE equipamentos_relatorio SET tipo_equipamento = 'Para-raio' WHERE tipo_equipamento = 'Para-raio de Linha'",
      )
      .execute()

    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')
    if (field) {
      field.values = [
        'Cabo',
        'Para-raio',
        'Transformador de Potencial',
        'Transformador de Corrente',
        'Seccionadora',
        'Transformador',
        'Disjuntor',
        'Relé',
      ]
      app.save(col)
    }
  },
)
