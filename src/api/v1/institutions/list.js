// library imports
const Q = require('q')

// project imports
const Institution = require('./../../../models/Institution')

module.exports = function (req, res, next) {
  Q(
    Institution.find().exec()
  )
    .then((institutions) => {
      // if instituion is null (meaning it did not exist in the collection)
      if (!institutions) {
        return res.status(404).send()
      }
      return res.status(200).send({ institutions: institutions })
    })
    .catch((err) => {
      next(err)
    })
}