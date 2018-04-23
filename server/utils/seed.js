const config = require('../../config')
const mongoose = require('mongoose')
const User = require('../api/user/model')
const Center = require('../api/center/model')
const Activity = require('../api/activity/model')
const Session = require('../api/session/model')
const factory = require('./modelFactory')
const { corsicaRandom } = require('./utilsFunctions')

const seedUsers = require('./seedData/users.json')
const seedTeachers = require('./seedData/teachers.json')
const seedCenters = require('./seedData/centers.json')
const seedActivities = require('./seedData/activities')

mongoose.connect(config.MONGODB_URI, err => {
  if (err) console.error('Could not connect to mongodb.')
})

// Clean DB
const models = [User, Center, Activity, Session]
models.map(model => model.remove({}).exec())

const users = []
const centers = []
const teachers = []
const activities = []
const sessions = []

const seed = async () => {
  console.log('\nCreating users...\n')
  for (let i = 0; i < seedUsers.length; i++) {
    users.push(await factory.user({ ...seedUsers[i], shortId: i + 1 }))
    console.log(`Short Id : ${users[i].shortId} - ${users[i].email}`)
  }

  console.log('\nCreating teachers...\n')
  for (let i = 0; i < seedTeachers.length; i++) {
    teachers.push(
      await factory.user({
        ...seedTeachers[i],
        shortId: 101 + i,
        role: 'teacher'
      })
    )
    console.log(`Short Id : ${teachers[i].shortId} - ${teachers[i].email}`)
  }

  console.log('\nCreating centers...\n')
  for (let i = 0; i < seedCenters.length; i++) {
    centers.push(await factory.center({ ...seedCenters[i], shortId: i + 1 }))
    console.log(`Short Id : ${centers[i].shortId} - ${centers[i].name}`)
  }

  console.log('\nCreating activities...\n')
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i]
    const numActivities = seedActivities.length
    for (let j = 0; j < numActivities; j++) {
      activities.push(
        await factory.activity({
          ...seedActivities[j],
          shortId: (i + 1) * 10 + j + 1,
          center: centers[i]._id
        })
      )
      console.log(
        `Short Id : ${activities[i * numActivities + j].shortId} - ${
          activities[i * numActivities + j].name
        } - ${center.name}`
      )
    }
    const min = (i + 1) * 10
    const max = (i + 2) * 10
    await Activity.find({ shortId: { $gt: min, $lt: max } }).exec(
      (err, activ) => {
        center.activities = activ
        center.save(err => {
          if (err) console.log('error on save of center:', err)
        })
      }
    )
  }

  // corsicaRandom() will link sessions who ends by 1 (ie 11, 21, ...) to first teacher
  console.log('\nCreating sessions...')
  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i]
    const numSession = 5
    for (let j = 0; j < numSession; j++) {
      sessions.push(
        await factory.session({
          shortId: (i + 1) * 10 + j + 1,
          activity,
          teacher: corsicaRandom(teachers, j)
        })
      )
      console.log(
        `Short Id : ${sessions[i * numSession + j].shortId} - ${
          sessions[i * numSession + j].startsAt
        }`
      )
    }

    const min = (i + 1) * 10
    const max = (i + 2) * 10
    await Session.find({ shortId: { $gt: min, $lt: max } }).exec(
      (err, sess) => {
        activity.sessions = sess
        activity.save(e => {
          if (e) console.log('error on save of activity:', e)
        })
      }
    )
  }

  console.log('Linking users to sessions...')
  await Session.find({ shortId: { $in: [11, 21, 31] } })
    .exec()
    .then(async ses => {
      await User.updateMany(
        { 'account.role': 'user' },
        { $set: { 'account.sessions': ses } }
      )
        .then(res => {
          console.log(`Users modified: ${res.nModified}/${res.n}`)
        })
        .catch(err => {
          console.error(err)
        })
    })

  console.log('Linking sessions to users...')
  await User.find({ 'account.role': 'user' })
    .exec()
    .then(async use => {
      await Session.updateMany(
        { shortId: { $in: [11, 21, 31] } },
        { $set: { bookedBy: use } }
      )
        .then(res => {
          console.log(`Sessions modified: ${res.nModified}/${res.n}`)
        })
        .catch(err => {
          console.error(err)
        })
    })

  console.log('Linking sessions to teachers')
  for (var i = 0; i < teachers.length; i++) {
    await User.findOne({ _id: teachers[i]._id })
      .exec()
      .then(async user => {
        await Session.find({ teacher: user._id })
          .exec()
          .then(async ses => {
            user.account.sessions = ses
            await user.save()
            console.log(
              `${ses.length} sessions link to teacher : ${user.email}`
            )
          })
      })
  }

  console.log(
    `\n \nCreated ${users.length} users, ${teachers.length} teachers, ${
      centers.length
    } centers, ${activities.length} activities, ${sessions.length} sessions`
  )
  mongoose.connection.close(() => {
    console.log('\n \n close connection')
  })
}

seed()
