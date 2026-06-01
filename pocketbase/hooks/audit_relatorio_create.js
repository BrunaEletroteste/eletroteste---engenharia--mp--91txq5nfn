onRecordCreateRequest((e) => {
  e.next()

  const user = e.auth
  if (user) {
    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const record = new Record(auditLogs)
    record.set('user', user.id)
    record.set('action_type', 'criacao')
    record.set('details', `Relatório ${e.record.getString('numero_relatorio')} criado`)
    $app.save(record)
  }
}, 'relatorios')
