const express = require('express')
const { checkLoggedIn } = require('../../middlewares/core')
const userController = require('../user/controller/controller')

const router = express.Router()

// L'authentification est obligatoire pour ces routes
router
  .get('/:id', checkLoggedIn, userController.show)
  .put('/:id', checkLoggedIn, userController.update)

module.exports = router
