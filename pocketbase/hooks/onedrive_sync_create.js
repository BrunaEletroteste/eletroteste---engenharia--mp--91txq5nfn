onRecordAfterCreateSuccess((e) => {
  let newFotos = e.record.get('fotos')
  if (!newFotos) newFotos = []
  if (!Array.isArray(newFotos)) newFotos = [newFotos]

  const photosToUpload = newFotos.filter((f) => typeof f === 'string' && f.trim() !== '')
  if (photosToUpload.length === 0) return e.next()

  const relatorio = $app.findRecordById('relatorios', e.record.get('relatorio_id'))
  const numRelatorio = relatorio.get('numero_relatorio')
  const clienteId = relatorio.get('cliente_id')
  const cliente = $app.findRecordById('clientes', clienteId)

  const sanitize = (name) =>
    String(name || '')
      .replace(/[\/\\:*?"<>|]/g, '_')
      .trim()
  const folderClient = sanitize(cliente.get('nome_empresa')) + ' - ' + sanitize(cliente.get('cnpj'))
  const folderReport = sanitize(numRelatorio)
  const folderEquipment = sanitize(e.record.get('tipo_equipamento'))

  const tenantId = $secrets.get('ONEDRIVE_TENANT_ID')
  const clientId = $secrets.get('ONEDRIVE_CLIENT_ID')
  const clientSecret = $secrets.get('ONEDRIVE_CLIENT_SECRET')
  const userUpn = $secrets.get('ONEDRIVE_LOGIN')

  if (!tenantId || !clientId || !clientSecret || !userUpn) {
    $app.logger().error('OneDrive secrets missing for synchronization')
    return e.next()
  }

  const tokenRes = $http.send({
    url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(clientId)}&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    timeout: 15,
  })

  if (tokenRes.statusCode !== 200) {
    $app.logger().error('OneDrive token acquisition failed', 'status', tokenRes.statusCode)
    return e.next()
  }
  const accessToken = tokenRes.json.access_token

  let backendUrl = $secrets.get('PB_INSTANCE_URL')
  if (!backendUrl) backendUrl = 'http://127.0.0.1:8080'
  if (backendUrl.endsWith('/')) backendUrl = backendUrl.slice(0, -1)

  const superuserToken = $secrets.get('PB_SUPERUSER_TOKEN')

  for (const photoName of photosToUpload) {
    try {
      const fileUrl = `${backendUrl}/api/files/${e.record.collection().id}/${e.record.id}/${photoName}`
      const downloadRes = $http.send({
        url: fileUrl,
        method: 'GET',
        headers: superuserToken ? { Authorization: `Bearer ${superuserToken}` } : {},
        timeout: 30,
      })

      if (downloadRes.statusCode !== 200) {
        $app
          .logger()
          .error(
            'Failed to download photo from PB for OneDrive sync',
            'photo',
            photoName,
            'status',
            downloadRes.statusCode,
          )
        continue
      }

      const bytes = downloadRes.body
      const fullPath = `Engenharia/Fotos/${folderClient}/${folderReport}/${folderEquipment}/${photoName}`
      const encodedPath = fullPath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')
      const uploadUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drive/root:/${encodedPath}:/content`

      const uploadRes = $http.send({
        url: uploadUrl,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: bytes,
        timeout: 60,
      })

      if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
        $app.logger().info('OneDrive photo upload success', 'path', fullPath)
      } else {
        $app.logger().error('OneDrive photo upload failed', 'status', uploadRes.statusCode)
      }
    } catch (err) {
      $app
        .logger()
        .error('Error syncing photo to OneDrive', 'photo', photoName, 'error', String(err))
    }
  }

  return e.next()
}, 'equipamentos_relatorio')
