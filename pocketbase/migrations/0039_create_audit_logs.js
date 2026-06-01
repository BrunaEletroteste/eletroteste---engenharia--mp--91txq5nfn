migrate(
  (app) => {
    const collection = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.tipo_acesso = 'admin'",
      viewRule: "@request.auth.tipo_acesso = 'admin'",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'action_type',
          type: 'select',
          required: true,
          values: ['login', 'criacao', 'edicao', 'exclusao'],
          maxSelect: 1,
        },
        {
          name: 'details',
          type: 'text',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_audit_logs_created ON audit_logs (created DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('audit_logs')
    app.delete(collection)
  },
)
