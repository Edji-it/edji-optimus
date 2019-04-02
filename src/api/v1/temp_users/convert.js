// library imports
const mongoose = require('mongoose')

// project imports
const Project = require('./../../../models/Project')

// updates all of the temp user's information to be owned by the new user (the req.user), and removes the temp user
module.exports = function(req, res, next) {
  let user = req.user
  let temp_id = req.params.temp_id

  if (!mongoose.validateEdjiId(temp_id)) {
    return res.status(400).send({ error: 'invalid mongo id' })
  }

  Project.updateOne(
    {
      temp_ids: temp_id,
      'comments.user_id': temp_id,
    },
    {
      $set: {
        'comments.$[elem].user_id': user._id.toString(),
        'comments.$[elem].author': user.fullname,
      },
      $pull: {
        temp_ids: mongoose.Types.ObjectId(temp_id),
      },
      $push: {
        students_ids: user._id,
      },
    },
    {
      multi: true,
      arrayFilters: [{ 'elem.user_id': temp_id }],
    },
  )
    .then(dbResponse => {
      return res.status(200).send({ updated: dbResponse })
    })
    .catch(err => {
      next(err)
    })
}
