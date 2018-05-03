function bodyToThrow(res) {
  return {
    error: "An error was expected but did not occured",
    "body recieved": res.body
  }
}

module.exports = { bodyToThrow }
