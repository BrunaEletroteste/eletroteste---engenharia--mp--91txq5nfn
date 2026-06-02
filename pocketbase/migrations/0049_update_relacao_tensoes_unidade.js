migrate(
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET unidade = '-' WHERE tipo_teste = 'Relação de Tensões'",
      )
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE testes_equipamento SET unidade = 'V' WHERE tipo_teste = 'Relação de Tensões' AND unidade = '-'",
      )
      .execute()
  },
)
