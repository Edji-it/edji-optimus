const express = require('express')

let router = express.Router()

const Mailchimp = require('mailchimp-api-v3')
let api = new Mailchimp(process.env.MAILCHIMP_API_TOKEN)

router.post('/add', function(req, res, next) {
  if (process.env.EDJI_STAGE === 'production') {
    let listId

    if (req.body.list == 'hero') {
      listId = 'e8ff5b5e49'
    } else if (req.body.list == 'hero-subscribed') {
      listId = '6780e536a5'
    } else if (req.body.list == 'new') {
      listId = 'a4b72972f1'
    }

    let data = {
      email_address: req.body.email,
      status: 'subscribed',
      merge_fields: {},
    }

    if (req.body.fname) {
      data.merge_fields.FNAME = req.body.fname
    }
    if (req.body.lname) {
      data.merge_fields.LNAME = req.body.lname
    }

    api
      .post('/lists/' + listId + '/members', data)
      .then(result => {
        return res.send({
          email: result.email_address,
          status: result.status,
        })
      })
      .catch(err => {
        return next(err)
      })
  }
})

module.exports = router
