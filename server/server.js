const mongoose = require("mongoose")
const express = require("express")
const morgan = require("morgan") // in order to log requests
const helmet = require("helmet") // protection package
const compression = require("compression") // compress server responses in GZIP
const bodyParser = require("body-parser") // to parse POST requests
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const cors = require("cors") // to authorize request to the API from another domaine
const HTTPBearerStrategy = require("passport-http-bearer").Strategy
const config = require("../config")
const User = require("../server/api/user/model")
const { errorHandler } = require("../server/middlewares/core")

const app = express()

mongoose.connect(config.MONGODB_URI, err => {
  if (err) console.error("Could not connect to mongodb.")
})

// we don't want it in test mode as it interfers with terminal display of test results
if (config.ENV !== "test") {
  app.use(morgan("dev"))
}

app.use(helmet())
app.use(compression())
app.use(bodyParser.json())
app.use("/api", cors())
app.use("/auth", cors())

app.use(passport.initialize())
// Local for login + password
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true,
      session: false
    },
    User.authenticateLocal()
  )
)

// Method `authenticateBearer` from model User
passport.use(new HTTPBearerStrategy(User.authenticateBearer()))

app.get("/", (req, res) => {
  res.send("Welcome to our API.")
})

// Routes:
app.use("/auth", require("./auth/routes"))
app.use("/api", require("./api/api"))

// Error 404 for all verbs (GET, POST, etc.) when page not found.
app.all("*", (req, res) => {
  res.status(404).json({ status: 404, error: "Not Found" })
})

// Error handling middleware: called with next(err_msg) within a route
app.use(errorHandler)

function mongooseDisconnect() {
  mongoose.connection.close()
}

let emptyDb
if (config.ENV !== "production") {
  emptyDb = function() {
    mongoose.connection.db.dropDatabase()
  }
}

module.exports = { app, mongooseDisconnect, emptyDb }
