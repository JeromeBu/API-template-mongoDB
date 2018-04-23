const { app } = require('./server/server')
const config = require('./config')

const server = app.listen(config.PORT, () => {
  console.log(
    `API running on port ${
      config.PORT
    } | ${config.ENV.toUpperCase()} environement | MONGODB_URI: ${
      config.MONGODB_URI
    } \n`
  )
})

module.exports = server // for testing
