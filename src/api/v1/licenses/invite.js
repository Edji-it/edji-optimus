// library imports
const Q = require('q')

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!license_id) { 
    return res.status(400).send({ error: 'license id is necessary to retrieve information' }) 
  }

  
}