migrate(
  (app) => {
    const collections = [
      {
        name: 'relatorios',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || criado_por = @request.auth.id",
      },
      {
        name: 'equipamentos_relatorio',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || relatorio_id.criado_por = @request.auth.id",
      },
      {
        name: 'testes_equipamento',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      },
      {
        name: 'parecer_tecnico',
        listRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
        viewRule:
          "@request.auth.tipo_acesso = 'admin' || @request.auth.tipo_acesso = 'revisor_interno' || @request.auth.tipo_acesso = 'tecnico_campo' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
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
        console.log('Error reverting ' + config.name, e)
      }
    }
  },
)
