const chai = require('chai')
const should = require('chai').should()
const chaiHttp = require('chai-http')

chai.use(chaiHttp)

const server = require('../../index')

describe('Home', () => {
  describe('GET /', () => {
    it('respond with welcome message', done => {
      chai
        .request(server)
        .get('/')
        .end((err, res) => {
          should.not.exist(err)
          res.should.have.status(200)
          res.text.should.include('Welcome to our API')
          done()
        })
    })
  })
})
