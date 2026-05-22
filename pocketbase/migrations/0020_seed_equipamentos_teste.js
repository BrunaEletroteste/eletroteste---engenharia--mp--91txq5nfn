migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('opcoes_padronizadas')

    const options = [
      {
        categoria: 'equipamento_isolamento',
        valor: 'Megôhmetro - MI 15KVe - Megabrás - Série: MI7004L',
      },
      {
        categoria: 'equipamento_isolamento',
        valor: 'Megôhmetro - MI 2550 - Megabrás - Série: 9036023',
      },
      {
        categoria: 'equipamento_isolamento',
        valor: 'Megôhmetro - MI 5500e - Megabrás - Série: OE 5214 J',
      },
      {
        categoria: 'equipamento_isolamento',
        valor: 'Termovisor - TI27 - Fluke - Série: TI27-12080408',
      },
      { categoria: 'equipamento_isolamento', valor: 'Termovisor - T530 - Flir - Série: 79314825' },
      { categoria: 'equipamento_relacao', valor: 'TTR - JH2702 - Wuhan - Série: 2024136' },
      {
        categoria: 'equipamento_enrolamento',
        valor: 'Microhmímetro Digital - MPK 256 - Megabrás - Série: UM 1200 B',
      },
      {
        categoria: 'equipamento_enrolamento',
        valor: 'Microhmímetro Digital - PK 230 - Nansen - Série: 035',
      },
      { categoria: 'equipamento_contatos', valor: 'Hipot - HT 60.05 CC - Mult Test - Série: 321' },
      { categoria: 'equipamento_contatos', valor: 'Hipot - HT 60.05 CC - Mult Test - Série: 412' },
      { categoria: 'equipamento_contatos', valor: 'Hipot - HT-100.1CA - Hypotec - Série: 106 A/B' },
    ]

    for (const opt of options) {
      try {
        app.findFirstRecordByData('opcoes_padronizadas', 'valor', opt.valor)
      } catch (_) {
        const record = new Record(col)
        record.set('categoria', opt.categoria)
        record.set('valor', opt.valor)
        app.save(record)
      }
    }
  },
  (app) => {
    const vals = [
      'Megôhmetro - MI 15KVe - Megabrás - Série: MI7004L',
      'Megôhmetro - MI 2550 - Megabrás - Série: 9036023',
      'Megôhmetro - MI 5500e - Megabrás - Série: OE 5214 J',
      'Termovisor - TI27 - Fluke - Série: TI27-12080408',
      'Termovisor - T530 - Flir - Série: 79314825',
      'TTR - JH2702 - Wuhan - Série: 2024136',
      'Microhmímetro Digital - MPK 256 - Megabrás - Série: UM 1200 B',
      'Microhmímetro Digital - PK 230 - Nansen - Série: 035',
      'Hipot - HT 60.05 CC - Mult Test - Série: 321',
      'Hipot - HT 60.05 CC - Mult Test - Série: 412',
      'Hipot - HT-100.1CA - Hypotec - Série: 106 A/B',
    ]

    for (const val of vals) {
      try {
        const record = app.findFirstRecordByData('opcoes_padronizadas', 'valor', val)
        app.delete(record)
      } catch (_) {}
    }
  },
)
