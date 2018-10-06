// import * as proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import * as rp from 'request-promise'
import 'mocha'

import { EmailService, EmailOptions } from './email'

describe('EmailService', () => {
  let rpStub: sinon.SinonStub
  const emailParams: EmailOptions = {
    email_template: 'fake-template',
    name: 'corbin',
    from: 'fake',
    email: 'something@gmail.com',
    vars_object: {

    }
  }

  beforeEach(() => {
    rpStub = sinon.stub(rp, 'post').resolves({ fake: true })
  })
  afterEach(() => {
    rpStub.restore()
  })

  it('should call request-promise with proper body', (done) => {
    EmailService.sendEmail(emailParams)
      .then((res) => {
        rpStub.calledOnce.should.be.true // make sure request is called exactly once
        res.fake.should.be.true // test that we stubbed properly

        let options: rp.OptionsWithUri = rpStub.firstCall.args[0]
        if (!options) {
          return done('no email options specified for request-promise')
        }
        options.should.have.property('headers')
        options.headers.should.have.property('Authorization')
        options.uri.toString().indexOf(['api', 'v1', 'emails', 'sendmail', emailParams.email_template].join('/')).should.be.greaterThan(-1)
        options.should.have.property('body')
        options.body.should.have.property('from')
        options.body.from.should.be.equal(emailParams.from + '@edji.it')
        options.body.should.have.property('subject')
        options.body.should.have.property('recipients')
        let recipients = options.body.recipients
        recipients.should.be.instanceOf(Array)
        recipients.forEach((recipient) => {
          recipient.should.have.property('name')
          recipient.name.should.be.equal(emailParams.name)
          recipient.should.have.property('email')
          recipient.email.should.be.equal(emailParams.email)
          recipient.should.have.property('vars')
          recipient.vars.should.be.equal(emailParams.vars_object)
        })

        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})