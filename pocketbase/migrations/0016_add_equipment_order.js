migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')

    if (!col.fields.getByName('ordem')) {
      col.fields.add(new NumberField({ name: 'ordem' }))
    }

    col.addIndex('idx_equip_rel_ordem', false, 'ordem', '')
    app.save(col)

    app
      .db()
      .newQuery(`
    WITH RankedEquipments AS (
      SELECT id, ROW_NUMBER() OVER(PARTITION BY relatorio_id ORDER BY created ASC) as rn
      FROM equipamentos_relatorio
    )
    UPDATE equipamentos_relatorio
    SET ordem = (SELECT rn FROM RankedEquipments WHERE RankedEquipments.id = equipamentos_relatorio.id)
    WHERE ordem IS NULL OR ordem = 0
  `)
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipamentos_relatorio')
    col.removeIndex('idx_equip_rel_ordem')

    const field = col.fields.getByName('ordem')
    if (field) {
      col.fields.removeById(field.id)
    }
    app.save(col)
  },
)
