migrate(
  (app) => {
    // Update "classe_precisao" to "Classe de Precisão", ignoring conflicts (duplicates)
    app
      .db()
      .newQuery(`
    UPDATE OR IGNORE opcoes_padronizadas 
    SET categoria = 'Classe de Precisão' 
    WHERE categoria = 'classe_precisao'
  `)
      .execute()

    // Remove any remaining old entries that couldn't be updated due to unique constraint
    app
      .db()
      .newQuery(`
    DELETE FROM opcoes_padronizadas 
    WHERE categoria = 'classe_precisao'
  `)
      .execute()

    // Update "tensao_primaria" and "tensao_primaira" to "Tensão"
    app
      .db()
      .newQuery(`
    UPDATE OR IGNORE opcoes_padronizadas 
    SET categoria = 'Tensão' 
    WHERE categoria IN ('tensao_primaria', 'tensao_primaira')
  `)
      .execute()

    // Remove any remaining old entries that couldn't be updated
    app
      .db()
      .newQuery(`
    DELETE FROM opcoes_padronizadas 
    WHERE categoria IN ('tensao_primaria', 'tensao_primaira')
  `)
      .execute()
  },
  (app) => {
    // Revert "Classe de Precisão" back to "classe_precisao"
    app
      .db()
      .newQuery(`
    UPDATE OR IGNORE opcoes_padronizadas 
    SET categoria = 'classe_precisao' 
    WHERE categoria = 'Classe de Precisão'
  `)
      .execute()

    app
      .db()
      .newQuery(`
    DELETE FROM opcoes_padronizadas 
    WHERE categoria = 'Classe de Precisão'
  `)
      .execute()

    // Revert "Tensão" back to "tensao_primaria"
    app
      .db()
      .newQuery(`
    UPDATE OR IGNORE opcoes_padronizadas 
    SET categoria = 'tensao_primaria' 
    WHERE categoria = 'Tensão'
  `)
      .execute()

    app
      .db()
      .newQuery(`
    DELETE FROM opcoes_padronizadas 
    WHERE categoria = 'Tensão'
  `)
      .execute()
  },
)
