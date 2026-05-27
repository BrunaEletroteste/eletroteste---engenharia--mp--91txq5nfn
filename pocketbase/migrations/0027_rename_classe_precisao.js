migrate(
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE opcoes_padronizadas SET categoria = 'Exatidão' WHERE categoria = 'Classe de Precisão'",
      )
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE opcoes_padronizadas SET categoria = 'Classe de Precisão' WHERE categoria = 'Exatidão'",
      )
      .execute()
  },
)
