migrate(
  (app) => {
    // 1. Update collection schema to allow 'Relé de Proteção'
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')
    const values = field.values.filter((v) => v !== 'Relé')
    if (!values.includes('Relé de Proteção')) {
      values.push('Relé de Proteção')
    }
    field.values = values
    app.save(col)

    // 2. Update existing data (raw SQL) to migrate legacy "Relé" records
    app
      .db()
      .newQuery(
        "UPDATE equipamentos_relatorio SET tipo_equipamento = 'Relé de Proteção' WHERE tipo_equipamento = 'Relé'",
      )
      .execute()

    // 3. Seed opcoes_padronizadas for Curvas and Tipo/Modelo
    const opcoesCol = app.findCollectionByNameOrId('opcoes_padronizadas')

    const curvas = [
      'IEC Normal Inverso',
      'IEC Muito Inverso',
      'IEC Longo Inverso',
      'IEC Ext. Inverso',
      'IEEE Mod. Inverso',
      'IEEE Muito Inverso',
      'IEEE Ext. Inverso',
      'ANSI Mod. Inverso',
      'ANSI Normal Inverso',
      'ANSI Ext. Inverso',
      'TD',
    ]
    for (const c of curvas) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          "categoria = 'Curva do Relé' && valor = {:v}",
          { v: c },
        )
      } catch (_) {
        const rec = new Record(opcoesCol)
        rec.set('categoria', 'Curva do Relé')
        rec.set('valor', c)
        app.save(rec)
      }
    }

    const modelos = ['SEL-751', 'Pexlink', 'UR-F60']
    for (const m of modelos) {
      try {
        app.findFirstRecordByFilter(
          'opcoes_padronizadas',
          "categoria = 'Tipo/Modelo do Relé de Proteção' && valor = {:v}",
          { v: m },
        )
      } catch (_) {
        const rec = new Record(opcoesCol)
        rec.set('categoria', 'Tipo/Modelo do Relé de Proteção')
        rec.set('valor', m)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Revert schema only
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    const field = col.fields.getByName('tipo_equipamento')
    const values = field.values.filter((v) => v !== 'Relé de Proteção')
    if (!values.includes('Relé')) {
      values.push('Relé')
    }
    field.values = values
    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE equipamentos_relatorio SET tipo_equipamento = 'Relé' WHERE tipo_equipamento = 'Relé de Proteção'",
      )
      .execute()
  },
)
