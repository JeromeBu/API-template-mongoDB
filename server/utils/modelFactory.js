const uid = require('uid2')
const User = require('../api/user/model')

const {
  randomDate,
  randomFromTable,
  roundMinutes
} = require('./utilsFunctions')
const faker = require('faker')

const images = [
  'https://www.shape.com/sites/shape.com/files/fb-crossfit-injuries.jpg',
  'https://www.esdo.fr/wp-content/uploads/2016/12/banniere_trx_suspension_training.jpg',
  'https://cdn-maf0.heartyhosting.com/sites/muscleandfitness.com/files/styles/full_node_image_1090x614/public/cardio-treadmill_1.jpg?itok=LTsMm6jA'
]

const inTwoWeeks = new Date()
inTwoWeeks.setDate(inTwoWeeks.getDate() + 30)

//  options: email, shortId, token, password, emailCheckValid
// emailCheckToken, emailCheckCreatedAt, firstName, lastName,
// gender, paidUntil, role
function createUser(options = {}, callback) {
  const promise = new Promise((resolve, reject) => {
    const password = options.password || 'Password1'
    const newUser = new User({
      shortId: options.shortId,
      email: options.email || faker.internet.email(),
      token: options.token || uid(32),
      emailCheck: {
        valid: !(options.emailCheckValid === false),
        token: options.emailCheckToken || uid(20),
        createdAt: options.emailCheckCreatedAt || new Date()
      },
      passwordChange: {
        valid: !(options.passwordChangeValid === false),
        token: options.passwordChangeToken || uid(20),
        createdAt: options.passwordChangeCreatedAt || new Date()
      },
      role: options.role || 'user',
      account: {
        firstName: options.firstName || faker.name.firstName(),
        lastName: options.lastName || faker.name.lastName(),
        image: options.image
      }
    })
    User.register(newUser, password, (err, user) => {
      if (err) {
        if (!callback) {
          reject(new Error(`Could not create user : ${err}`))
        } else {
          console.error(`Could not create user :  ${err}`)
        }
      } else if (!callback) {
        resolve(user)
      } else {
        callback(user)
      }
    })
  })
  return promise
}

module.exports = {
  user: createUser
}
