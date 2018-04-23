const express = require('express')
const { handleResetPasswordErrors } = require('../middlewares/user')
const authController = require('./controller')

const router = express.Router()

router.post('/sign_up', authController.sign_up)

router.post('/log_in', authController.log_in)

router.route('/email_check').get(authController.email_check)

router.route('/forgotten_password').post(authController.forgotten_password)
router
  // const options = { emailPresenceInQuery: true, tokenPresenceInQuery: true };
  .route('/reset_password')
  .get(handleResetPasswordErrors({}), authController.reset_password_GET)
  .post(handleResetPasswordErrors({}), authController.reset_password_POST)

module.exports = router
