migrate(
  (app) => {
    // 1. Update Users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new SelectField({
        name: 'tipo_acesso',
        values: ['admin', 'tecnico_campo', 'revisor_interno', 'cliente'],
        maxSelect: 1,
      }),
    )
    users.fields.add(new TextField({ name: 'cnpj_cliente' }))
    users.fields.add(new BoolField({ name: 'ativo' }))
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)

    // 2. Clientes
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.tipo_acesso = 'admin'",
      viewRule: "@request.auth.tipo_acesso = 'admin'",
      createRule: "@request.auth.tipo_acesso = 'admin'",
      updateRule: "@request.auth.tipo_acesso = 'admin'",
      deleteRule: "@request.auth.tipo_acesso = 'admin'",
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        { name: 'nome_empresa', type: 'text', required: true },
        { name: 'endereco', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'email_contato', type: 'email' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_clientes_cnpj ON clientes (cnpj)'],
    })
    app.save(clientes)

    // 3. Relatorios
    const relatorios = new Collection({
      name: 'relatorios',
      type: 'base',
      listRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && cliente_id.cnpj = @request.auth.cnpj_cliente) || criado_por = @request.auth.id",
      viewRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && cliente_id.cnpj = @request.auth.cnpj_cliente) || criado_por = @request.auth.id",
      createRule: "@request.auth.tipo_acesso = 'admin' || @request.auth.id != ''",
      updateRule: "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id",
      deleteRule: "@request.auth.tipo_acesso = 'admin' || criado_por = @request.auth.id",
      fields: [
        { name: 'numero_relatorio', type: 'text', required: true },
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: clientes.id,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'data_execucao', type: 'date', required: true },
        { name: 'acompanhante', type: 'text' },
        { name: 'proxima_manutencao', type: 'date' },
        { name: 'status', type: 'select', values: ['rascunho', 'finalizado'], required: true },
        { name: 'criado_por', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_relatorios_numero ON relatorios (numero_relatorio)'],
    })
    app.save(relatorios)

    // 4. Equipamentos
    const equipamentos = new Collection({
      name: 'equipamentos_relatorio',
      type: 'base',
      listRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || relatorio_id.criado_por = @request.auth.id",
      viewRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || relatorio_id.criado_por = @request.auth.id",
      createRule:
        "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id",
      updateRule:
        "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id",
      deleteRule:
        "@request.auth.tipo_acesso = 'admin' || relatorio_id.criado_por = @request.auth.id",
      fields: [
        {
          name: 'relatorio_id',
          type: 'relation',
          collectionId: relatorios.id,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'tipo_equipamento',
          type: 'select',
          values: [
            'Cabo',
            'Para-raio',
            'Transformador de Potencial',
            'Transformador de Corrente',
            'Seccionadora',
            'Transformador',
            'Disjuntor',
            'Relé',
          ],
          required: true,
        },
        { name: 'dados_tecnicos', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(equipamentos)

    // 5. Testes
    const testes = new Collection({
      name: 'testes_equipamento',
      type: 'base',
      listRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      viewRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      createRule:
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      updateRule:
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      deleteRule:
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      fields: [
        {
          name: 'equipamento_id',
          type: 'relation',
          collectionId: equipamentos.id,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'tipo_teste',
          type: 'select',
          values: [
            'Isolamento',
            'Tensão',
            'Resistência dos Enrolamentos',
            'Resistência dos Contatos',
          ],
          required: true,
        },
        { name: 'valor_teste', type: 'number', required: true },
        { name: 'unidade', type: 'text', required: true },
        { name: 'data_teste', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(testes)

    // 6. Parecer Técnico
    const parecer = new Collection({
      name: 'parecer_tecnico',
      type: 'base',
      listRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      viewRule:
        "@request.auth.tipo_acesso = 'admin' || (@request.auth.tipo_acesso = 'cliente' && equipamento_id.relatorio_id.cliente_id.cnpj = @request.auth.cnpj_cliente) || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      createRule:
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      updateRule:
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      deleteRule:
        "@request.auth.tipo_acesso = 'admin' || equipamento_id.relatorio_id.criado_por = @request.auth.id",
      fields: [
        {
          name: 'equipamento_id',
          type: 'relation',
          collectionId: equipamentos.id,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'parecer',
          type: 'select',
          values: ['Conforme', 'Possui Ressalvas', 'Não Conforme'],
          required: true,
        },
        {
          name: 'parecer_anterior',
          type: 'select',
          values: ['Conforme', 'Possui Ressalvas', 'Não Conforme'],
        },
        { name: 'justificativa_mudanca', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(parecer)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('parecer_tecnico'))
    app.delete(app.findCollectionByNameOrId('testes_equipamento'))
    app.delete(app.findCollectionByNameOrId('equipamentos_relatorio'))
    app.delete(app.findCollectionByNameOrId('relatorios'))
    app.delete(app.findCollectionByNameOrId('clientes'))

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('tipo_acesso')
    users.fields.removeByName('cnpj_cliente')
    users.fields.removeByName('ativo')
    app.save(users)
  },
)
