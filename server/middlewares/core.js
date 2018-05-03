const config = require("../../config")
const passport = require("passport")

const _errorHandler = (err, req, res, next) => {
  // keep next parameter, very important !
  console.log("Error handler : ")
  let error = err
  if (res.statusCode === 200) {
    console.log("Error arrived with status 200")
    res.status(503)
  }
  console.error(error)
  if (config.ENV === "production") error = "An error occurred"
  res.json({ error })
}
exports.errorHandler = _errorHandler

exports.checkLoggedIn = (req, res, next) => {
  passport.authenticate("bearer", { session: false }, (err, user) => {
    // info is also available with err, and user
    if (err) {
      res.status(503)
      return _errorHandler(err.message)
    }
    if (!user) return res.status(401).json({ error: "Unauthorized" })
    req.currentUser = { id: user.id }
    req.isAdmin = user.role === "admin"
    return next()
  })(req, res, next)
}
