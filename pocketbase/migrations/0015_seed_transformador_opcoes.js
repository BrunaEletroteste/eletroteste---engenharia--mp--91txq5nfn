migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    const values = [
      { categoria: 'Ligado em', valor: '10.200' },
      { categoria: 'Ligado em', valor: '10.800' },
      { categoria: 'Ligado em', valor: '11.400' },
      { categoria: 'Ligado em', valor: '12.000' },
      { categoria: 'Ligado em', valor: '12.600' },
      { categoria: 'Ligado em', valor: '13.200' },
      { categoria: 'Ligado em', valor: '13.800' },
      { categoria: 'Potência', valor: '45' },
      { categoria: 'Potência', valor: '75' },
      { categoria: 'Potência', valor: '125' },
      { categoria: 'Potência', valor: '300' },
      { categoria: 'Potência', valor: '500' },
      { categoria: 'Potência', valor: '750' },
      { categoria: 'Potência', valor: '1.000' },
      { categoria: 'Potência', valor: '1.200' },
      { categoria: 'Potência', valor: '2.500' },
    ]

    for (const item of values) {
      try {
        app.findFirstRecordByFilter('opcoes_padronizadas', 'categoria={:cat} && valor={:val}', {
          cat: item.categoria,
          val: item.valor,
        })
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', item.categoria)
        record.set('valor', item.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const values = [
      { categoria: 'Ligado em', valor: '10.200' },
      { categoria: 'Ligado em', valor: '10.800' },
      { categoria: 'Ligado em', valor: '11.400' },
      { categoria: 'Ligado em', valor: '12.000' },
      { categoria: 'Ligado em', valor: '12.600' },
      { categoria: 'Ligado em', valor: '13.200' },
      { categoria: 'Ligado em', valor: '13.800' },
      { categoria: 'Potência', valor: '45' },
      { categoria: 'Potência', valor: '75' },
      { categoria: 'Potência', valor: '125' },
      { categoria: 'Potência', valor: '300' },
      { categoria: 'Potência', valor: '500' },
      { categoria: 'Potência', valor: '750' },
      { categoria: 'Potência', valor: '1.000' },
      { categoria: 'Potência', valor: '1.200' },
      { categoria: 'Potência', valor: '2.500' },
    ]

    for (const item of values) {
      try {
        const record = app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          'categoria={:cat} && valor={:val}',
          {
            cat: item.categoria,
            val: item.valor,
          },
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
