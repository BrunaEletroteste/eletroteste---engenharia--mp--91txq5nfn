migrate(
  (app) => {
    const collections = [
      {
        name: 'clientes',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno'",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno'",
      },
      {
        name: 'relatorios',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || criado_por = @request.auth.id",
      },
      {
        name: 'equipamentos_relatorio',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || relatorio_id.criado_por = @request.auth.id",
      },
      {
        name: 'testes_equipamento',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      },
      {
        name: 'parecer_tecnico',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      },
    ]

    for (const config of collections) {
      try {
        const col = app.findCollectionByNameOrId(config.name)
        col.listRule = config.listRule
        col.viewRule = config.viewRule
        app.save(col)
      } catch (e) {
        console.log('Error updating ' + config.name, e)
      }
    }
  },
  (app) => {
    const collections = [
      {
        name: 'clientes',
        listRule: "@request.auth.tipo_acesso = 'admin'",
        viewRule: "@request.auth.tipo_acesso = 'admin'",
      },
      {
        name: 'relatorios',
        listRule: "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id",
        viewRule: "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id",
      },
      {
        name: 'equipamentos_relatorio',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id",
      },
      {
        name: 'testes_equipamento',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      },
      {
        name: 'parecer_tecnico',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      },
    ]

    for (const config of collections) {
      try {
        const col = app.findCollectionByNameOrId(config.name)
        col.listRule = config.listRule
        col.viewRule = config.viewRule
        app.save(col)
      } catch (e) {
        console.log('Error reverting ' + config.name, e)
      }
    }
  },
)
