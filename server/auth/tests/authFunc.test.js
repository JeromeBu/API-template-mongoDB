const chai = require('chai')
const should = require('chai').should()
const chaiHttp = require('chai-http')
const server = require('../../../index')
const User = require('../../api/user/model')
const factory = require('../../utils/modelFactory')

chai.use(chaiHttp)

function createTestUsers(options) {
  return async () => {
    const initialPassword = 'old_password'
    try {
      await User.remove({})
      options.validEmailUser = await factory.user({
        email: 'validEmail@mail.com',
        emailCheckValid: true,
        password: initialPassword,
        passwordChangeValid: true
      })
      options.notValidEmailUser = await factory.user({
        email: 'notValidEmail@mail.com',
        emailCheckValid: false,
        password: initialPassword,
        passwordChangeValid: true
      })
      options.alreadyUsedLinkUser = await factory.user({
        email: 'alreadyUsedLink@mail.com',
        emailCheckValid: true,
        password: initialPassword,
        passwordChangeValid: false
      })
      const threeHoursAgo = new Date()
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3)
      options.outDatedTokenUser = await factory.user({
        email: 'outDatedToken@mail.com',
        emailCheckValid: true,
        password: initialPassword,
        passwordChangeValid: true,
        passwordChangeCreatedAt: threeHoursAgo
      })
    } catch (e) {
      console.error(e)
    }
  }
}

function noEmailGiven(done, verb, body = {}) {
  let request = chai.request(server)[verb]('/auth/reset_password')
  if (verb === 'post') request = request.send(body)

  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have.property('error').that.include('No email specified')
    done()
  })
}

function noTokenGiven(done, verb, body = {}) {
  let request = chai
    .request(server)
    [verb]('/auth/reset_password?email=hello@mail.com')
  if (verb === 'post') request = request.send(body)

  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have.property('error').that.include('No token specified')
    done()
  })
}

function emailNotInDb(done, verb, body = {}) {
  let request = chai
    .request(server)
    [verb]('/auth/reset_password?email=hello@mail.com&token=some_token')
  if (verb === 'post') request = request.send(body)

  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have.property('error').that.include('Wrong credentials')
    done()
  })
}

function wrongToken(done, verb, validEmailUser, body = {}) {
  let request = chai
    .request(server)
    [verb](
      `/auth/reset_password?email=${validEmailUser.email}&token=some_token`
    )
  if (verb === 'post') request = request.send(body)

  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have.property('error').that.include('Wrong credentials')
    done()
  })
}

function linkUsed(done, verb, alreadyUsedLinkUser, body = {}) {
  let request = chai
    .request(server)
    [verb](
      `/auth/reset_password?email=${alreadyUsedLinkUser.email}&token=${
        alreadyUsedLinkUser.passwordChange.token
      }`
    )
  if (verb === 'post') request = request.send(body)
  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have
      .property('error')
      .that.include('link has already been used')
    done()
  })
}

function tokenOutdated(done, verb, outDatedTokenUser, body = {}) {
  let request = chai
    .request(server)
    [verb](
      `/auth/reset_password?email=${outDatedTokenUser.email}&token=${
        outDatedTokenUser.passwordChange.token
      }`
    )
  if (verb === 'post') request = request.send(body)
  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have.property('error').that.include('Outdated link')
    res.body.should.have.property('message').that.include('link is outdated')
    done()
  })
}

function notValidEmail(done, verb, notValidEmailUser, body = {}) {
  let request = chai
    .request(server)
    [verb](
      `/auth/reset_password?email=${notValidEmailUser.email}&token=${
        notValidEmailUser.passwordChange.token
      }`
    )
  if (verb === 'post') request = request.send(body)
  request.end((err, res) => {
    res.should.have.status(401)
    res.should.be.a('object')
    res.body.should.have.property('error').that.include('Email not confirmed')
    res.body.should.have
      .property('message')
      .that.include('validate your email first')
    done()
  })
}

function authorizeAccess(done, verb, validEmailUser, body = {}) {
  let request = chai
    .request(server)
    [verb](
      `/auth/reset_password?email=${validEmailUser.email}&token=${
        validEmailUser.passwordChange.token
      }`
    )
  if (verb === 'post') request = request.send(body)
  request.end((err, res) => {
    should.not.exist(err)
    res.should.be.a('object')
    res.body.should.have
      .property('message')
      .that.include('Ready to recieve new password')
    done()
  })
}

module.exports = {
  createTestUsers,
  noEmailGiven,
  noTokenGiven,
  emailNotInDb,
  wrongToken,
  linkUsed,
  tokenOutdated,
  notValidEmail,
  authorizeAccess
}
