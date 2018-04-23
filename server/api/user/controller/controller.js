const User = require('../model')

exports.show = (req, res, next) => {
  // const { currentUser } = req   value available when user logged (middlware)
  User.findById(req.params.id)
    .select('account')
    .exec()
    .then(user => {
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.json({
        _id: user.id,
        account: user.account
      })
    })
    .catch(err => {
      res.status(503)
      return next(err.message)
    })
}

exports.update = async (req, res, next) => {
  const userId = req.params.id
  const { dataToUpdateInAccount } = req.body
  const { currentUser, isAdmin } = req

  if (!(currentUser.id === userId || isAdmin)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You are not allowed to update this user'
    })
  }

  const dataToChange = {}
  if (dataToUpdateInAccount) {
    Object.keys(dataToUpdateInAccount).forEach(key => {
      dataToChange[`account.${key}`] = dataToUpdateInAccount[key]
    })
  } else {
    return res.status(400).json({
      error: 'no data to update given'
    })
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      { _id: userId },
      dataToChange,
      { new: true }
    )
    if (!updatedUser)
      return res.status(404).json({
        error: 'no User found with that id'
      })
    return res.status(201).json({
      message: 'user updated with success',
      user: { account: updatedUser.account }
    })
  } catch (error) {
    res.status(503)
    return next(error.message)
  }
}
