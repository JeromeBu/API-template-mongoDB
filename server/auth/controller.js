const uid2 = require('uid2')
const passport = require('passport')
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
})
const config = require('../../config')
const User = require('../api/user/model')
const confirmEmail = require('../emails/confirmationEmail')
const forgetPasswordEmail = require('../emails/forgetPasswordEmail')

exports.sign_up = (req, res) => {
  const { email, firstName, lastName, gender, password } = req.body
  // password validation : ( min 8 charcters, 1 uppercase, 1 lowercase, 1 number)
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password))
    return res.status(400).json({
      error:
        'User validation failed: the password is not strong enough (required : 8 characters minimum, 1 lowercase letter, 1 uppercase letter, 1 number)'
    })
  return User.register(
    new User({
      email,
      token: uid2(32),
      emailCheck: {
        token: uid2(20),
        createdAt: new Date()
      },
      account: {
        firstName,
        lastName,
        gender
      }
    }),
    password, // password has to be the second parameter transmitted
    (err, user) => {
      if (err) {
        res.status(400)
        return res.json({ error: err.message })
      }
      // sending mails only in production ENV
      if (config.ENV === 'production') {
        const url = req.headers.host
        mailgun.messages().send(confirmEmail(url, user), (error, body) => {
          console.error('Mail Error', error)
          console.log('Mail Body', body)
        })
      }
      return res.json({
        message: 'User successfully signed up',
        user: {
          _id: user.id,
          token: user.token,
          account: user.account
        }
      })
    }
  )
}

exports.log_in = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user) => {
    // info parameter available to
    if (err) {
      res.status(400)
      return next(err.message)
    }
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    if (!user.emailCheck.valid)
      return res.status(206).json({ message: 'Please confirm email first' })
    User.findById(user.id)
      .exec()
      .then(populatedUser =>
        res.json({
          message: 'Login successful',
          user: {
            _id: populatedUser.id,
            token: populatedUser.token,
            account: populatedUser.account
          }
        })
      )
      .catch(e => {
        console.log(e)
        res.status(503)
        return next(e.message)
      })
  })(req, res, next)
}

exports.forgotten_password = (req, res, next) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'No email specified' })
  return User.findOne({ email }, (err, user) => {
    if (err) {
      res.status(503)
      return next(err.message)
    }
    if (!user) {
      return res.status(400).json({
        error: "We don't have a user with this email in our dataBase"
      })
    }
    if (!user.emailCheck.valid)
      return res.status(400).json({ error: 'Your email is not confirmed' })
    user.passwordChange = {
      token: uid2(20),
      createdAt: new Date(),
      valid: true
    }
    return user.save(error => {
      if (error) {
        res.status(503)
        return next(error.message)
      }
      if (config.ENV === 'production') {
        const url = req.headers.host
        mailgun.messages().send(forgetPasswordEmail(url, user), (Err, body) => {
          console.error('Mail Error', Err)
          console.log('Mail Body', body)
        })
      }
      return res.json({
        message: 'An email has been send with a link to change your password'
      })
    })
  })
}

exports.email_check = (req, res, next) => {
  const { email, token } = req.query
  if (!token) return res.status(400).send('No token specified')
  return User.findOne({ 'emailCheck.token': token, email }, (err, user) => {
    if (err) {
      res.status(503)
      return next(err.message)
    }
    if (!user) return res.status(400).send('Wrong credentials')
    if (user.emailCheck.valid)
      return res
        .status(206)
        .json({ message: 'You have already confirmed your email' })
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (user.emailCheck.createdAt < yesterday)
      return res.status(400).json({
        error:
          'This link is outdated (older than 24h), please try to sign up again'
      })
    user.emailCheck.valid = true
    return user.save(error => {
      if (error) {
        res.status(503)
        return next(error.message)
      }
      return res.json({ message: 'Your email has been verified with success' })
    })
  })
}

exports.reset_password_GET = (req, res) => {
  res.json({ message: 'Ready to recieve new password' })
}

exports.reset_password_POST = (req, res, next) => {
  const { newPassword, newPasswordConfirmation } = req.body
  if (!newPassword)
    return res.status(400).json({ error: 'No password provided' })
  if (newPassword !== newPasswordConfirmation)
    return res
      .status(400)
      .json({ error: 'Password and confirmation are different' })
  const { user } = req
  return user.setPassword(newPassword, () => {
    user.passwordChange.valid = false
    user.save(error => {
      if (error) {
        res.status(503)
        return next(error.message)
      }
      return res.status(200).json({ message: 'Password reset successfully' })
    })
  })
}
