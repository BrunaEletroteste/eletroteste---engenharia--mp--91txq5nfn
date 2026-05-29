migrate(
  (app) => {
    const opcoes = ['Dyn11', 'Dyn1', 'Dyn5', 'Ynd1', 'Ynd11', 'Ynyn0', 'Yd1', 'Yd11']

    const collection = app.findCollectionByNameOrId('opcoes_padronizadas')

    for (const valor of opcoes) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          "categoria = 'Diagrama' && valor = {:valor}",
          { valor },
        )
      } catch (_) {
        const record = new Record(collection)
        record.set('categoria', 'Diagrama')
        record.set('valor', valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const opcoes = ['Dyn11', 'Dyn1', 'Dyn5', 'Ynd1', 'Ynd11', 'Ynyn0', 'Yd1', 'Yd11']

    for (const valor of opcoes) {
      try {
        const existing = app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          "categoria = 'Diagrama' && valor = {:valor}",
          { valor },
        )
        app.delete(existing)
      } catch (_) {}
    }
  },
)
