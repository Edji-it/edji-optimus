// library import
const chai = require("chai")
chai.use(require("chai-http"))

// project imports
const TEST = require('../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/readings/'

describe('POST /api/v1/readings/', () => {
  let invite_email = 'optimus@prime.ed'
  let eval = 'soFake'
  let person_sharing = 'fakeSender'
  let person_sharing_email = 'fakeSender@fakethis.com'
  let person_receiving = 'fakePersonReceiving'
  let pdfName = 'fakePDF'
  let pdf = 'data:text/vnd-example+xyz;foo=bar;base64,R0lGODdh'
  let reading_name = 'fakeReading'

  // should attempt to send report while leaving email out and return back a 400
  it('should get an error when making post call and leaving email off', (done) => {
    chai.request(TEST.SERVER)
      .post(ENDPOINT_URL + 'reports')
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .send({
        eval: eval,
        person_sharing: person_sharing,
        person_sharing_email: person_sharing_email,
        person_receiving: person_receiving,
        pdfName: pdfName,
        pdf: pdf,
        reading_name: reading_name
      })
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(400)
        done()
      })
  })

  // should attempt to send report while leaving pdf out and return back a 400
  it('should get an error when making post call and leaving pdf off', (done) => {
    chai.request(TEST.SERVER)
      .post(ENDPOINT_URL + 'reports')
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .send({
        email: invite_email,
        eval: eval,
        person_sharing: person_sharing,
        person_sharing_email: person_sharing_email,
        person_receiving: person_receiving,
        pdfName: pdfName,
        reading_name: reading_name
      })
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(400)
        done()
      })
  })

  // should attempt to send report while leaving name out and return back a 400
  it('should get an error when making post call and leaving name off', (done) => {
    chai.request(TEST.SERVER)
      .post(ENDPOINT_URL + 'reports')
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .send({
        email: invite_email,
        eval: eval,
        person_sharing: person_sharing,
        person_sharing_email: person_sharing_email,
        pdfName: pdfName,
        pdf: pdf,
        reading_name: reading_name
      })
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(400)
        done()
      })
  })
})