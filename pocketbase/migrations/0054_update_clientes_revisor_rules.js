migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.createRule =
      "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno'"
    col.updateRule =
      "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno'"
    col.deleteRule =
      "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno'"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.createRule = "@request.auth.tipo_acesso = 'admin'"
    col.updateRule = "@request.auth.tipo_acesso = 'admin'"
    col.deleteRule = "@request.auth.tipo_acesso = 'admin'"
    app.save(col)
  },
)
