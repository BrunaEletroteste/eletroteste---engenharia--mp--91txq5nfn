onRecordAfterCreateSuccess((e) => {
  const tenantId = $secrets.get('ONEDRIVE_TENANT_ID')
  const clientId = $secrets.get('ONEDRIVE_CLIENT_ID')
  const clientSecret = $secrets.get('ONEDRIVE_CLIENT_SECRET')
  const login = $secrets.get('ONEDRIVE_LOGIN')
  const instanceUrl = $secrets.get('PB_INSTANCE_URL')
  const suToken = $secrets.get('PB_SUPERUSER_TOKEN')

  if (!tenantId || !clientId || !clientSecret || !login || !instanceUrl || !suToken) {
    $app.logger().error('OneDrive or PB secrets missing for relatorio create sync.')
    return e.next()
  }

  const record = e.record
  const anexosVal = record.get('anexos')

  const getArray = (val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string' && val !== '') return [val]
    return []
  }

  const files = getArray(anexosVal)
  if (files.length === 0) {
    return e.next()
  }

  const clienteId = record.getString('cliente_id')
  if (!clienteId) return e.next()

  let cliente
  try {
    cliente = $app.findRecordById('clientes', clienteId)
  } catch (err) {
    $app.logger().error('Cliente not found for relatorio sync', 'relatorioId', record.id)
    return e.next()
  }

  const sanitize = (name) => {
    return (name || '').replace(/[<>:"\/\\|?*\x00-\x1F]/g, '-').trim()
  }

  const folderName = `${sanitize(cliente.getString('nome_empresa'))} - ${sanitize(cliente.getString('cnpj'))}`
  const numRelSanitized = sanitize(record.getString('numero_relatorio'))

  const basePath = `Engenharia/Anexos/${folderName}/${numRelSanitized}`

  const encodePath = (path) => {
    return path
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')
  }

  const tokenRes = $http.send({
    url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${clientId}&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default&client_secret=${clientSecret}&grant_type=client_credentials`,
    timeout: 15,
  })

  if (tokenRes.statusCode !== 200) {
    $app.logger().error('Failed to get OneDrive token', 'status', tokenRes.statusCode)
    return e.next()
  }
  const token = tokenRes.json.access_token

  for (const fileName of files) {
    if (!fileName) continue

    const fileUrl = `${instanceUrl}/api/files/${record.collectionName()}/${record.id}/${fileName}`
    const fileRes = $http.send({
      url: fileUrl,
      method: 'GET',
      headers: { Authorization: `Bearer ${suToken}` },
      timeout: 120,
    })

    if (fileRes.statusCode !== 200) {
      $app
        .logger()
        .error(
          'Failed to download file from PB',
          'fileName',
          fileName,
          'status',
          fileRes.statusCode,
        )
      continue
    }

    const targetPath = `${basePath}/${fileName}`
    const uploadUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(login)}/drive/root:/${encodePath(targetPath)}:/content`

    const uploadRes = $http.send({
      url: uploadUrl,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileRes.body,
      timeout: 120,
    })

    if (uploadRes.statusCode >= 300) {
      $app
        .logger()
        .error(
          'Failed to upload file to OneDrive',
          'fileName',
          fileName,
          'status',
          uploadRes.statusCode,
        )
    } else {
      $app.logger().info('Successfully synced file to OneDrive', 'fileName', fileName)
    }
  }

  return e.next()
}, 'relatorios')
