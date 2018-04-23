const config = require('../../config')
const mongoose = require('mongoose')
const User = require('../api/user/model')
const factory = require('./modelFactory')

const seedUsers = require('./seedData/users.json')

mongoose.connect(config.MONGODB_URI, err => {
  if (err) console.error('Could not connect to mongodb.')
})

// Clean DB
const models = [User]
models.map(model => model.remove({}).exec())

const users = []

const seed = async () => {
  console.log('\nCreating users...\n')
  for (let i = 0; i < seedUsers.length; i += 1) {
    users.push(await factory.user({ ...seedUsers[i], shortId: i + 1 }))
    console.log(`Short Id : ${users[i].shortId} - ${users[i].email}`)
  }

  console.log(`\n \nCreated ${users.length} users`)
  mongoose.connection.close(() => {
    console.log('\n \n close connection')
  })
}

seed()
