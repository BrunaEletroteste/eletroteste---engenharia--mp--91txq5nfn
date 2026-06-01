migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.listRule = "@request.auth.tipo_acesso = 'admin' || id = @request.auth.id"
    col.viewRule = "@request.auth.tipo_acesso = 'admin' || id = @request.auth.id"
    col.createRule = "@request.auth.tipo_acesso = 'admin'"
    col.updateRule = "@request.auth.tipo_acesso = 'admin' || id = @request.auth.id"
    col.deleteRule = "@request.auth.tipo_acesso = 'admin' || id = @request.auth.id"

    const field = col.fields.getByName('tipo_acesso')
    if (field && field.type === 'select') {
      field.values = ['admin', 'tecnico_campo', 'revisor_interno', 'cliente', 'visitante']
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.createRule = ''
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'

    const field = col.fields.getByName('tipo_acesso')
    if (field && field.type === 'select') {
      field.values = ['admin', 'tecnico_campo', 'revisor_interno', 'cliente']
    }

    app.save(col)
  },
)
