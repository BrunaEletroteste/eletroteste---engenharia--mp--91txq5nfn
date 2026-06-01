onRecordCreate((e) => {
  e.record.set('emailVisibility', true)
  e.next()
}, 'users')

onRecordUpdate((e) => {
  e.record.set('emailVisibility', true)
  e.next()
}, 'users')
