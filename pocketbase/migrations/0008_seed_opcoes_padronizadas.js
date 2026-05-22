migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    const seed = [
      { categoria: 'fabricante', valor: 'Brasformer' },
      { categoria: 'fabricante', valor: 'Inepar' },
      { categoria: 'fabricante', valor: 'Itaipu' },
      { categoria: 'fabricante', valor: 'Isolet' },
      { categoria: 'fabricante', valor: 'Sarel' },
      { categoria: 'fabricante', valor: 'Schneider' },
      { categoria: 'fabricante', valor: 'Sellux' },
      { categoria: 'fabricante', valor: 'Senner' },
      { categoria: 'fabricante', valor: 'Siemens' },
      { categoria: 'fabricante', valor: 'Waltec' },
      { categoria: 'fabricante', valor: 'WEG' },

      { categoria: 'corrente_nominal', valor: '5' },
      { categoria: 'corrente_nominal', valor: '25' },
      { categoria: 'corrente_nominal', valor: '75' },
      { categoria: 'corrente_nominal', valor: '100' },
      { categoria: 'corrente_nominal', valor: '400' },
      { categoria: 'corrente_nominal', valor: '630' },
      { categoria: 'corrente_nominal', valor: '1.250' },
    ]

    for (const item of seed) {
      try {
        app
          .db()
          .newQuery(
            'SELECT id FROM opcoes_padronizadas WHERE categoria = {:categoria} AND valor = {:valor}',
          )
          .bind({ categoria: item.categoria, valor: item.valor })
          .one()
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', item.categoria)
        record.set('valor', item.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    app
      .db()
      .newQuery(
        "DELETE FROM opcoes_padronizadas WHERE categoria IN ('fabricante', 'corrente_nominal')",
      )
      .execute()
  },
)
