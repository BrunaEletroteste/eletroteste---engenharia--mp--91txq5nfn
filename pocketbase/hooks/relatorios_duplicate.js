routerAdd(
  'POST',
  '/backend/v1/relatorios/{id}/duplicate',
  (e) => {
    const id = e.request.pathValue('id')

    let newReportId = ''

    try {
      $app.runInTransaction((txApp) => {
        const original = txApp.findRecordById('relatorios', id)

        const newReport = new Record(txApp.findCollectionByNameOrId('relatorios'))

        let baseNum = original.getString('numero_relatorio')
        if (baseNum.endsWith('-COPIA')) {
          baseNum = baseNum + '-' + $security.randomString(4).toUpperCase()
        } else if (baseNum.includes('-COPIA')) {
          baseNum =
            baseNum.substring(0, baseNum.lastIndexOf('-COPIA') + 6) +
            '-' +
            $security.randomString(4).toUpperCase()
        } else {
          baseNum = baseNum + '-COPIA'
        }

        let isUnique = false
        let finalNum = baseNum
        let attempts = 0
        while (!isUnique && attempts < 10) {
          try {
            txApp.findFirstRecordByData('relatorios', 'numero_relatorio', finalNum)
            finalNum = baseNum + '-' + $security.randomString(4).toUpperCase()
            attempts++
          } catch (_) {
            isUnique = true
          }
        }

        const today = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'

        newReport.set('numero_relatorio', finalNum)
        newReport.set('cliente_id', original.get('cliente_id'))
        newReport.set('data_execucao', today)
        newReport.set('acompanhante', original.get('acompanhante'))
        newReport.set('status', 'rascunho')
        newReport.set('criado_por', e.auth ? e.auth.id : null)
        newReport.set('observacoes', original.get('observacoes'))

        txApp.save(newReport)
        newReportId = newReport.id

        const equipamentos = txApp.findRecordsByFilter(
          'equipamentos_relatorio',
          `relatorio_id = '${id}'`,
          '',
          0,
          0,
        )

        for (const eq of equipamentos) {
          const newEq = new Record(txApp.findCollectionByNameOrId('equipamentos_relatorio'))
          newEq.set('relatorio_id', newReportId)
          newEq.set('tipo_equipamento', eq.get('tipo_equipamento'))
          newEq.set('dados_tecnicos', eq.get('dados_tecnicos'))

          txApp.save(newEq)
          const newEqId = newEq.id

          const testes = txApp.findRecordsByFilter(
            'testes_equipamento',
            `equipamento_id = '${eq.id}'`,
            '',
            0,
            0,
          )
          for (const t of testes) {
            const newTest = new Record(txApp.findCollectionByNameOrId('testes_equipamento'))
            newTest.set('equipamento_id', newEqId)
            newTest.set('tipo_teste', t.get('tipo_teste'))
            newTest.set('valor_teste', 0)
            newTest.set('unidade', t.get('unidade'))
            newTest.set('data_teste', today)
            newTest.set('dados_detalhados', t.get('dados_detalhados'))
            newTest.set('observacoes', '')

            txApp.save(newTest)
          }

          const pareceres = txApp.findRecordsByFilter(
            'parecer_tecnico',
            `equipamento_id = '${eq.id}'`,
            '',
            0,
            0,
          )
          for (const p of pareceres) {
            const newParecer = new Record(txApp.findCollectionByNameOrId('parecer_tecnico'))
            newParecer.set('equipamento_id', newEqId)
            newParecer.set('parecer_anterior', p.getString('parecer'))
            newParecer.set('parecer', '')
            newParecer.set('justificativa_mudanca', '')
            newParecer.set('observacoes', '')

            txApp.saveNoValidate(newParecer)
          }
        }
      })

      return e.json(200, { id: newReportId })
    } catch (err) {
      $app.logger().error('Duplicate error', 'error', err.message)
      return e.badRequestError(err.message || 'Não foi possível duplicar o relatório.')
    }
  },
  $apis.requireAuth(),
)
