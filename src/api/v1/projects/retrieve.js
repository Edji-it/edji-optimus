// library imports
const Q = require('q')

// project imports
const Project = require('./../../../models/Project')

module.exports = function(req, res) {
  let user = req.user

  let project = "success"

  // Q(
    
  // )
  // .then((project) => {
  //   // if project is null (meaning it did not exist in the collection)
  //   if (!project || project.length < 1) {
  //     return res.status(404).send()
  //   }
    return res.status(200).send({ project: project })
  // })
  // .catch((error)=> {
  //   console.error(error)
  //   return res.status(500).send()
  // })
}