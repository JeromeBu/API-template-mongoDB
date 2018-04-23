const User = require('../api/user/model')
const { errorHandler } = require('./core')
// middleware for errorHandling
exports.handleResetPasswordErrors = (options = {}) => (req, res, next) => {
  const { email, token } = req.query
  if (!email) return res.status(401).json({ error: 'No email specified' })
  if (!token) return res.status(401).json({ error: 'No token specified' })
  return User.findOne({ email, 'passwordChange.token': token }, (err, user) => {
    if (err) {
      res.status(503)
      return errorHandler(err.message)
    }
    if (!user) return res.status(401).json({ error: 'Wrong credentials' })
    if (!user.passwordChange.valid)
      return res.status(401).json({ error: 'This link has already been used' })
    const twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
    if (user.passwordChange.createdAt < twoHoursAgo)
      return res.status(401).json({
        error: 'Outdated link',
        message: 'This link is outdated (older than 2h)'
      })
    if (!user.emailCheck.valid)
      return res.status(401).json({
        error: 'Email not confirmed',
        message: 'Please,validate your email first'
      })
    req.user = user
    return next()
  })
}
