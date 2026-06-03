routerAdd('GET', '/backend/v1/validar-relatorio/{id}', (e) => {
  try {
    const id = e.request.pathValue('id')

    // First, look up the report by ID.
    // If not found, look up by numero_relatorio to satisfy both /validar/:id and /validar/:numero_relatorio
    let report
    try {
      report = $app.findRecordById('relatorios', id)
    } catch (_) {
      report = $app.findFirstRecordByData('relatorios', 'numero_relatorio', id)
    }

    let clienteName = 'N/A'
    let clienteCnpj = 'N/A'
    try {
      $app.expandRecord(report, ['cliente_id'])
      const cliente = report.expandedOne('cliente_id')
      if (cliente) {
        clienteName = cliente.getString('nome_empresa')
        clienteCnpj = cliente.getString('cnpj')
      }
    } catch (_) {}

    return e.json(200, {
      id: report.id,
      numero_relatorio: report.getString('numero_relatorio'),
      data_execucao: report.getString('data_execucao'),
      data_fim: report.getString('data_fim'),
      status: report.getString('status'),
      responsavel_tecnico: report.getString('responsavel_tecnico'),
      cliente: {
        nome_empresa: clienteName,
        cnpj: clienteCnpj,
      },
    })
  } catch (err) {
    return e.notFoundError('Relatório não encontrado ou inválido.')
  }
})
