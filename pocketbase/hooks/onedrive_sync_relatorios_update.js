onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = e.record.original()

  const getArray = (val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string' && val !== '') return [val]
    return []
  }

  const newFiles = getArray(record.get('anexos'))
  const oldFiles = original ? getArray(original.get('anexos')) : []

  const numRelChanged =
    original && record.getString('numero_relatorio') !== original.getString('numero_relatorio')
  const cliChanged = original && record.getString('cliente_id') !== original.getString('cliente_id')

  const addedFiles = newFiles.filter((f) => !oldFiles.includes(f))
  const removedFiles = oldFiles.filter((f) => !newFiles.includes(f))

  if (addedFiles.length === 0 && removedFiles.length === 0 && !numRelChanged && !cliChanged) {
    return e.next()
  }

  const tenantId = $secrets.get('ONEDRIVE_TENANT_ID')
  const clientId = $secrets.get('ONEDRIVE_CLIENT_ID')
  const clientSecret = $secrets.get('ONEDRIVE_CLIENT_SECRET')
  const login = $secrets.get('ONEDRIVE_LOGIN')
  const instanceUrl = $secrets.get('PB_INSTANCE_URL')
  const suToken = $secrets.get('PB_SUPERUSER_TOKEN')

  if (!tenantId || !clientId || !clientSecret || !login || !instanceUrl || !suToken) {
    $app.logger().error('OneDrive or PB secrets missing for relatorio update sync.')
    return e.next()
  }

  const sanitize = (name) => {
    if (name === null || name === undefined) return ''
    return String(name)
      .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '-')
      .trim()
  }

  let safeClientName = 'Sem Cliente'
  let safeCnpj = '00000000000000'
  const clienteId = record.getString('cliente_id')

  if (clienteId) {
    try {
      const cliente = $app.findRecordById('clientes', clienteId)
      safeClientName = sanitize(cliente.getString('nome_empresa')) || 'Sem Cliente'
      safeCnpj = sanitize(cliente.getString('cnpj')) || '00000000000000'
    } catch (err) {
      $app.logger().error('Cliente not found for relatorio update sync', 'relatorioId', record.id)
    }
  }

  const numRelRaw = record.getString('numero_relatorio')
  const safeNumRel = sanitize(numRelRaw) || 'Sem Numero'

  const folderName = `${safeClientName} - ${safeCnpj}`
  const basePath = `Engenharia/Anexos/${folderName}/${safeNumRel}`

  let oldBasePath = basePath
  if (numRelChanged || cliChanged) {
    let oldSafeClientName = safeClientName
    let oldSafeCnpj = safeCnpj

    if (cliChanged) {
      const oldClienteId = original.getString('cliente_id')
      if (oldClienteId) {
        try {
          const oldCliente = $app.findRecordById('clientes', oldClienteId)
          oldSafeClientName = sanitize(oldCliente.getString('nome_empresa')) || 'Sem Cliente'
          oldSafeCnpj = sanitize(oldCliente.getString('cnpj')) || '00000000000000'
        } catch (err) {
          $app
            .logger()
            .error('Old Cliente not found for relatorio update sync', 'relatorioId', record.id)
        }
      } else {
        oldSafeClientName = 'Sem Cliente'
        oldSafeCnpj = '00000000000000'
      }
    }

    const oldNumRelRaw = original.getString('numero_relatorio')
    const oldSafeNumRel = sanitize(oldNumRelRaw) || 'Sem Numero'
    const oldFolderName = `${oldSafeClientName} - ${oldSafeCnpj}`
    oldBasePath = `Engenharia/Anexos/${oldFolderName}/${oldSafeNumRel}`
  }

  let filesToUpload = addedFiles
  let filesToDelete = removedFiles.map((f) => ({ name: f, path: oldBasePath }))

  if (numRelChanged || cliChanged) {
    filesToUpload = newFiles
    filesToDelete = oldFiles.map((f) => ({ name: f, path: oldBasePath }))
  } else {
    filesToDelete = removedFiles.map((f) => ({ name: f, path: basePath }))
  }

  if (filesToUpload.length === 0 && filesToDelete.length === 0) {
    return e.next()
  }

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

  // Upload new or migrated files
  for (const fileName of filesToUpload) {
    if (!fileName) continue

    const fileUrl = `${instanceUrl}/api/files/${record.collectionName()}/${record.id}/${fileName}`
    const fileRes = $http.send({
      url: fileUrl,
      method: 'GET',
      headers: { Authorization: `Bearer ${suToken}` },
      timeout: 120,
    })

    if (fileRes.statusCode !== 200) {
      $app.logger().error('Failed to download file from PB for update sync', 'fileName', fileName)
      continue
    }

    const safeFileName = sanitize(fileName)
    const targetPath = `${basePath}/${safeFileName}`
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
          'Failed to upload file to OneDrive on update',
          'fileName',
          fileName,
          'status',
          uploadRes.statusCode,
        )
    } else {
      $app.logger().info('Successfully synced file to OneDrive', 'fileName', fileName)
    }
  }

  // Delete removed or old path files
  for (const fileObj of filesToDelete) {
    if (!fileObj.name) continue

    const safeFileName = sanitize(fileObj.name)
    const targetPath = `${fileObj.path}/${safeFileName}`
    const deleteUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(login)}/drive/root:/${encodePath(targetPath)}`

    const delRes = $http.send({
      url: deleteUrl,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15,
    })

    if (delRes.statusCode >= 300 && delRes.statusCode !== 404) {
      $app
        .logger()
        .error(
          'Failed to delete file from OneDrive',
          'fileName',
          fileObj.name,
          'status',
          delRes.statusCode,
        )
    } else {
      $app.logger().info('Successfully deleted file from OneDrive', 'fileName', fileObj.name)
    }
  }

  return e.next()
}, 'relatorios')
