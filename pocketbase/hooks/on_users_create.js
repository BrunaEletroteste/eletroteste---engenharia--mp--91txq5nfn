onRecordCreate((e) => {
  try {
    const info = e.requestInfo()
    const isAdmin = info.auth && info.auth.getString('tipo_acesso') === 'admin'
    if (!info.hasSuperuserAuth() && !isAdmin) {
      e.record.set('ativo', false)
      e.record.set('tipo_acesso', 'visitante')
    }
  } catch (_) {
    // Not an HTTP request, allow default
  }
  e.next()
}, 'users')
