// library imports
const Q = require('q')
var mongoose = require("mongoose")

// project imports
const Institution = require('./../../../models/Institution')

module.exports = function(req, res) {
  // the institution_id is a param that will be used to find the institution
  let institutionId = req.params.institution_id

  // we cannot search for an institution if a valid institution_id is not passed in
  if (!mongoose.Types.ObjectId.isValid(institutionId)) { 
    return res.status(403).send() 
  }
  Q(
    Institution.find(
      {
        _id: institutionId
      },
      {
        name: 1,
        abbreviation: 1
      }
    ).exec()
  )
  .then((institution) => {
    // if instituion is null (meaning it did not exist in the collection)
    if (!institution) {
      return res.status(404).send() 
    }
    return res.status(200).send({ institution: institution })
  })
  .catch((error)=> {
    console.error(error)
    res.status(500).send()
  })
}