migrate(
  (app) => {
    app.runInTransaction((txApp) => {
      const relatorios = txApp.findCollectionByNameOrId('relatorios')
      relatorios.updateRule = "@request.auth.id != ''"
      txApp.save(relatorios)

      const equipamentos = txApp.findCollectionByNameOrId('equipamentos_relatorio')
      equipamentos.createRule = "@request.auth.id != ''"
      equipamentos.updateRule = "@request.auth.id != ''"
      equipamentos.deleteRule = "@request.auth.id != ''"
      txApp.save(equipamentos)

      const testes = txApp.findCollectionByNameOrId('testes_equipamento')
      testes.createRule = "@request.auth.id != ''"
      testes.updateRule = "@request.auth.id != ''"
      testes.deleteRule = "@request.auth.id != ''"
      txApp.save(testes)

      const parecer = txApp.findCollectionByNameOrId('parecer_tecnico')
      parecer.createRule = "@request.auth.id != ''"
      parecer.updateRule = "@request.auth.id != ''"
      parecer.deleteRule = "@request.auth.id != ''"
      txApp.save(parecer)
    })
  },
  (app) => {
    app.runInTransaction((txApp) => {
      const relatorios = txApp.findCollectionByNameOrId('relatorios')
      relatorios.updateRule = "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id"
      txApp.save(relatorios)

      const equipamentos = txApp.findCollectionByNameOrId('equipamentos_relatorio')
      equipamentos.createRule =
        "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id"
      equipamentos.updateRule =
        "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id"
      equipamentos.deleteRule =
        "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id"
      txApp.save(equipamentos)

      const testes = txApp.findCollectionByNameOrId('testes_equipamento')
      testes.createRule =
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
      testes.updateRule =
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
      testes.deleteRule =
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
      txApp.save(testes)

      const parecer = txApp.findCollectionByNameOrId('parecer_tecnico')
      parecer.createRule =
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
      parecer.updateRule =
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
      parecer.deleteRule =
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id"
      txApp.save(parecer)
    })
  },
)
