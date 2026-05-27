migrate(
  (app) => {
    app.db().newQuery("DELETE FROM opcoes_padronizadas WHERE categoria = 'Ligado em'").execute()
  },
  (app) => {
    // Down migration is intentionally left blank as we cannot restore deleted records without hardcoded backups
  },
)
