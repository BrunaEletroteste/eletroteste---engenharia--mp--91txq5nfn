onRecordBeforeDeleteRequest((e) => {
  const relatorioId = e.record.id

  const equipamentos = $app.findRecordsByFilter(
    'equipamentos_relatorio',
    `relatorio_id = '${relatorioId}'`,
    '',
    1000,
    0,
  )

  for (const eq of equipamentos) {
    const testes = $app.findRecordsByFilter(
      'testes_equipamento',
      `equipamento_id = '${eq.id}'`,
      '',
      1000,
      0,
    )
    for (const t of testes) {
      $app.delete(t)
    }

    const pareceres = $app.findRecordsByFilter(
      'parecer_tecnico',
      `equipamento_id = '${eq.id}'`,
      '',
      1000,
      0,
    )
    for (const p of pareceres) {
      $app.delete(p)
    }

    $app.delete(eq)
  }

  e.next()
}, 'relatorios')
