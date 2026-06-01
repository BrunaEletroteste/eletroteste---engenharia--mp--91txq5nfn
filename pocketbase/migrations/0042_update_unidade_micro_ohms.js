migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE testes_equipamento SET unidade = 'Micro-Ohms' WHERE unidade = 'Micro-Ohm'")
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery("UPDATE testes_equipamento SET unidade = 'Micro-Ohm' WHERE unidade = 'Micro-Ohms'")
      .execute()
  },
)
