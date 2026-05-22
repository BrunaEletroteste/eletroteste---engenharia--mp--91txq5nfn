migrate(
  (app) => {
    const collection = new Collection({
      name: 'opcoes_padronizadas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.tipo_acesso = 'admin'",
      updateRule: "@request.auth.tipo_acesso = 'admin'",
      deleteRule: "@request.auth.tipo_acesso = 'admin'",
      fields: [
        { name: 'categoria', type: 'text', required: true },
        { name: 'valor', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_opcoes_padronizadas_cat_val ON opcoes_padronizadas (categoria, valor)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('opcoes_padronizadas')
    app.delete(collection)
  },
)
