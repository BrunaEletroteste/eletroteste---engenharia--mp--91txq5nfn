onRecordDeleteRequest((e) => {
  const relNum = e.record.getString('numero_relatorio')
  e.next()

  const user = e.auth
  if (user) {
    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const record = new Record(auditLogs)
    record.set('user', user.id)
    record.set('action_type', 'exclusao')
    record.set('details', `Relatório ${relNum} excluído`)
    $app.save(record)
  }
}, 'relatorios')
