migrate(
  (app) => {
    // Update existing 'cliente' users to 'visitante'
    app
      .db()
      .newQuery("UPDATE users SET tipo_acesso = 'visitante' WHERE tipo_acesso = 'cliente'")
      .execute()

    // Update users collection schema
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('cnpj_cliente')

    const tipoAcesso = users.fields.getByName('tipo_acesso')
    if (tipoAcesso) {
      tipoAcesso.values = ['admin', 'tecnico_campo', 'revisor_interno', 'visitante', 'inativo']
    }
    app.save(users)

    // Update relatorios collection rules
    const relatorios = app.findCollectionByNameOrId('relatorios')
    relatorios.listRule = "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id"
    relatorios.viewRule = "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id"
    app.save(relatorios)

    // Update equipamentos_relatorio collection rules
    const equipamentos = app.findCollectionByNameOrId('equipamentos_relatorio')
    equipamentos.listRule =
      "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id"
    equipamentos.viewRule =
      "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id"
    app.save(equipamentos)

    // Update testes_equipamento collection rules
    const testes = app.findCollectionByNameOrId('testes_equipamento')
    testes.listRule =
      "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    testes.viewRule =
      "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    app.save(testes)

    // Update parecer_tecnico collection rules
    const parecer = app.findCollectionByNameOrId('parecer_tecnico')
    parecer.listRule =
      "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    parecer.viewRule =
      "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    app.save(parecer)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('cnpj_cliente')) {
      users.fields.add(new TextField({ name: 'cnpj_cliente' }))
    }
    const tipoAcesso = users.fields.getByName('tipo_acesso')
    if (tipoAcesso) {
      tipoAcesso.values = [
        'admin',
        'tecnico_campo',
        'revisor_interno',
        'cliente',
        'visitante',
        'inativo',
      ]
    }
    app.save(users)

    const relatorios = app.findCollectionByNameOrId('relatorios')
    relatorios.listRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && cliente_id.cnpj = @request.auth.cnpj_cliente) || criado_por = @request.auth.id"
    relatorios.viewRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && cliente_id.cnpj = @request.auth.cnpj_cliente) || criado_por = @request.auth.id"
    app.save(relatorios)

    const equipamentos = app.findCollectionByNameOrId('equipamentos_relatorio')
    equipamentos.listRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || relatorio_id.criado_por = @request.auth.id"
    equipamentos.viewRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || relatorio_id.criado_por = @request.auth.id"
    app.save(equipamentos)

    const testes = app.findCollectionByNameOrId('testes_equipamento')
    testes.listRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    testes.viewRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    app.save(testes)

    const parecer = app.findCollectionByNameOrId('parecer_tecnico')
    parecer.listRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    parecer.viewRule =
      "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id"
    app.save(parecer)
  },
)
