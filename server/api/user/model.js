const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
  shortId: Number, // shortId is useful when seeding data, it facilitates associations
  email: {
    type: String,
    validate: {
      validator: str =>
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          str.toLowerCase()
        ),
      message: '{VALUE} is not a valid email address'
    },
    required: [true, 'User phone number required']
  },
  emailCheck: {
    valid: { type: Boolean, default: false },
    token: String,
    createdAt: Date
  },
  passwordChange: {
    valid: { type: Boolean, default: true },
    token: String,
    createdAt: Date
  },
  // password: String,
  token: String,
  // Token ables to authentify with `passport-http-bearer`
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true,
    default: 'user'
  },
  // Here`account` is for public information
  account: {
    firstName: {
      type: String,
      required: true
    },
    lastName: String,
    paidUntil: {
      type: Date,
      required: true,
      default: '01/01/1980'
    },
    image: {
      type: String
    }
  }
})

UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'email', // Authentification will use `email` instead of `username`
  session: false // no session in API
})

// Find a user with `email` and `password`
UserSchema.statics.authenticateLocal = function() {
  const _self = this
  return (req, email, password, cb) => {
    _self.findByUsername(email, true, (err, user) => {
      if (err) return cb(err)
      if (user) {
        return user.authenticate(password, cb)
      }
      return cb(null, false)
    })
  }
}

// Used with `passport-http-bearer` finds user with `token`
UserSchema.statics.authenticateBearer = function() {
  const _self = this
  return (token, cb) => {
    if (!token) {
      cb(null, false)
    } else {
      _self.findOne({ token }, (err, user) => {
        if (err) return cb(err)
        if (!user) return cb(null, false)
        return cb(null, user)
      })
    }
  }
}

module.exports = mongoose.model('User', UserSchema, 'users')
