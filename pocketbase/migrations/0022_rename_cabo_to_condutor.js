migrate(
  (app) => {
    // Update existing data first so they don't violate the selectValues constraints
    app
      .db()
      .newQuery(
        `UPDATE equipamentos_relatorio SET tipo_equipamento = 'Condutor Elétrico' WHERE tipo_equipamento = 'Cabo'`,
      )
      .execute()

    // Update collection schema
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')
    field.values = [
      'Condutor Elétrico',
      'Para-raio de Linha',
      'Transformador de Potencial',
      'Transformador de Corrente',
      'Seccionadora',
      'Transformador',
      'Disjuntor',
      'Relé',
    ]
    app.save(col)
  },
  (app) => {
    // Revert data
    app
      .db()
      .newQuery(
        `UPDATE equipamentos_relatorio SET tipo_equipamento = 'Cabo' WHERE tipo_equipamento = 'Condutor Elétrico'`,
      )
      .execute()

    // Revert schema
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')
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
  },
)
