migrate(
  (app) => {
    const users = app.findRecordsByFilter('users', '1=1', '', 10000, 0)
    for (let i = 0; i < users.length; i++) {
      users[i].set('emailVisibility', true)
      app.saveNoValidate(users[i])
    }
  },
  (app) => {
    const users = app.findRecordsByFilter('users', '1=1', '', 10000, 0)
    for (let i = 0; i < users.length; i++) {
      users[i].set('emailVisibility', false)
      app.saveNoValidate(users[i])
    }
  },
)
