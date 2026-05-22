migrate(
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Resistências dos Isolamentos' WHERE tipo_teste = 'Isolamento'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Relação de Tensões' WHERE tipo_teste = 'Tensão'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Resistências dos Enrolamentos' WHERE tipo_teste = 'Resistência dos Enrolamentos'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Resistências dos Contatos' WHERE tipo_teste = 'Resistência dos Contatos'",
      )
      .execute()

    const col = app.findCollectionByNameOrId('testes_equipamento')
    col.fields.add(
      new SelectField({
        name: 'tipo_teste',
        required: true,
        maxSelect: 1,
        values: [
          'Resistências dos Isolamentos',
          'Relação de Tensões',
          'Resistências dos Enrolamentos',
          'Resistências dos Contatos',
        ],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('testes_equipamento')
    col.fields.add(
      new SelectField({
        name: 'tipo_teste',
        required: true,
        maxSelect: 1,
        values: [
          'Isolamento',
          'Tensão',
          'Resistência dos Enrolamentos',
          'Resistência dos Contatos',
        ],
      }),
    )
    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Isolamento' WHERE tipo_teste = 'Resistências dos Isolamentos'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Tensão' WHERE tipo_teste = 'Relação de Tensões'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Resistência dos Enrolamentos' WHERE tipo_teste = 'Resistências dos Enrolamentos'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET tipo_teste = 'Resistência dos Contatos' WHERE tipo_teste = 'Resistências dos Contatos'",
      )
      .execute()
  },
)
