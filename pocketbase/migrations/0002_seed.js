migrate(
  (app) => {
    // 1. Seed Admin
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'bruna@eletroteste.com')
    } catch (_) {
      admin = new Record(users)
      admin.setEmail('bruna@eletroteste.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Bruna Admin')
      admin.set('tipo_acesso', 'admin')
      admin.set('ativo', true)
      app.save(admin)
    }

    // 2. Seed Clientes
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const seedClientes = [
      {
        cnpj: '11222333000144',
        nome: 'Cliente A',
        endereco: 'Rua A, 123',
        telefone: '11999999999',
        email: 'contato@clientea.com',
      },
      {
        cnpj: '22333444000155',
        nome: 'Cliente B',
        endereco: 'Rua B, 456',
        telefone: '11888888888',
        email: 'contato@clienteb.com',
      },
    ]
    let cIds = []
    for (const cData of seedClientes) {
      try {
        const existing = app.findFirstRecordByData('clientes', 'cnpj', cData.cnpj)
        cIds.push(existing.id)
      } catch (_) {
        const rec = new Record(clientesCol)
        rec.set('cnpj', cData.cnpj)
        rec.set('nome_empresa', cData.nome)
        rec.set('endereco', cData.endereco)
        rec.set('telefone', cData.telefone)
        rec.set('email_contato', cData.email)
        app.save(rec)
        cIds.push(rec.id)
      }
    }

    // 3. Seed Reports
    const relatoriosCol = app.findCollectionByNameOrId('relatorios')
    const seedReports = [
      {
        numero_relatorio: '001/2026',
        cliente_id: cIds[0],
        data_execucao: '2026-05-10 12:00:00.000Z',
        status: 'rascunho',
        criado_por: admin.id,
        observacoes: 'Revisão inicial',
      },
      {
        numero_relatorio: '002/2026',
        cliente_id: cIds[1],
        data_execucao: '2026-05-11 12:00:00.000Z',
        status: 'finalizado',
        criado_por: admin.id,
        observacoes: 'Manutenção completa',
      },
      {
        numero_relatorio: '003/2026',
        cliente_id: cIds[0],
        data_execucao: '2026-05-12 12:00:00.000Z',
        status: 'rascunho',
        criado_por: admin.id,
        observacoes: 'Aguardando peças',
      },
    ]
    for (const rData of seedReports) {
      try {
        app.findFirstRecordByData('relatorios', 'numero_relatorio', rData.numero_relatorio)
      } catch (_) {
        const rec = new Record(relatoriosCol)
        Object.entries(rData).forEach(([k, v]) => rec.set(k, v))
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'bruna@eletroteste.com')
      app.delete(admin)
    } catch (_) {}
  },
)
