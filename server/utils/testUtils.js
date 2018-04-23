const User = require('../api/user/model')

exports.emptyDb = async () => {
  await User.remove({})
}
