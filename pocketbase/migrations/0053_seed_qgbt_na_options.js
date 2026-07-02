migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    function seedIfNotExists(categoria, valor) {
      try {
        app.findFirstRecordByFilter('opcoes_padronizadas', 'categoria = {:cat} && valor = {:val}', {
          cat: categoria,
          val: valor,
        })
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', categoria)
        record.set('valor', valor)
        app.save(record)
      }
    }

    seedIfNotExists('corrente_ajuste_curto', 'N/A')

    try {
      var existing = app.findRecordsByFilter(
        'opcoes_padronizadas',
        "categoria = 'corrente_nominal'",
        'valor',
        1000,
        0,
      )
      for (var i = 0; i < existing.length; i++) {
        seedIfNotExists('corrente_ajuste_curto', existing[i].getString('valor'))
      }
    } catch (_) {}

    seedIfNotExists('temporizacao_curto', 'N/A')

    var timingValues = [
      '0,1',
      '0,2',
      '0,3',
      '0,4',
      '0,5',
      '0,6',
      '0,7',
      '0,8',
      '0,9',
      '1,0',
      '1,5',
      '2,0',
      '2,5',
      '3,0',
      '4,0',
      '5,0',
    ]
    for (var j = 0; j < timingValues.length; j++) {
      seedIfNotExists('temporizacao_curto', timingValues[j])
    }
  },
  (app) => {
    var categories = ['corrente_ajuste_curto', 'temporizacao_curto']
    for (var c = 0; c < categories.length; c++) {
      try {
        var records = app.findRecordsByFilter(
          'opcoes_padronizadas',
          "categoria = '" + categories[c] + "'",
          'valor',
          1000,
          0,
        )
        for (var i = 0; i < records.length; i++) {
          try {
            app.delete(records[i])
          } catch (_) {}
        }
      } catch (_) {}
    }
  },
)
