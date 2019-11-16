// library imports
const express = require('express')

// project imports
const TempUser = require('../models/TempUser').default
const generateLoginObjectForUser = require('./../middleware/login-controller').generateLoginObjectForUser
const cleanMongoValidationError = require('./../error-handlers/mongo-validation').cleanMongoValidationError

const router = express.Router()

router.post('/', async function(req, res, next) {
  var userData = req.body.user

  if (!userData) {
    return res.status(400).send({ validationErrors: { user: 'required' } })
  }

  try {
    let result = await TempUser(userData).edjiSave()
    return res.status(201).send(generateLoginObjectForUser(result))
  } catch (error) {
    // constructs object with list of model-defined errors to send to user
    if (error.name === 'ValidationError') {
      let validationErrors = cleanMongoValidationError(error)
      return res.status(406).send({ validationErrors })
    } else if (error.code === 11000) {
      return res.status(409).send()
    } else {
      return next(error)
    }
  }
})

module.exports = router
