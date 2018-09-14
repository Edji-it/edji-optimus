// library imports
const mongoose = require('mongoose')

// project imports
const Project = require('./../../../models/Project')

// updates all of the temp user's information to be owned by the new user (the req.user), and removes the temp user
module.exports = function(req, res) {
  let user = req.user
  let temp_id = req.params.temp_id

  if (!mongoose.Types.ObjectId.isValid(temp_id)) {
    return res.status(400).send({ error: 'invalid mongo id' })
  }

  Project.update(
    {
      temp_ids: temp_id
    },
    {
      $set: {
        "comments.$[].user_id": temp_id,
        "comments.$[].author": user.fullname
      },
      $pull: {
        temp_ids: mongoose.Types.ObjectId(temp_id)
      },
      $push: {
        students_ids: user._id
      }
    },
    {
      multi: true
    }
  )
  .then((dbResponse) => {
    return res.status(200).send({ updated: dbResponse })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}

//------------DO NOT MODIFY THIS ROUTE WITHOUT TALKING TO CORBIN------------//
router.put("/convert/:temp_id", authRequired, function(req, res) {
  let user = req.user
  let temp_id = req.params.temp_id

  if (!mongoose.Types.ObjectId.isValid(temp_id)) {
    return res.status(400).send({ error: 'invalid mongo id' })
  }

  // update all of the projects the user has opened, and replace their comments with their new info


  // find all the projects that the temp user has opened
  Q(Project.find({ temp_ids: temp_id }).exec())
  .then((projects) => {
      let promises = []
      projects.forEach((project) => {
          if (project && project.comments) {

              // change each of the comment's user_id and fullname to match the new user
              project.comments = project.comments.map((comment) => {
                  if (comment.user_id == temp_id) {
                      comment.user_id = user._id
                      comment.author = user.fullname
                  }
                  return comment
              })

              // remove the temp_id from the project
              project.temp_ids.splice(project.temp_ids.indexOf(temp_id), 1)
              // add the user's new id
              if (project.students_ids) { project.students_ids.push(user._id) }
              else { project.students_ids = [user._id] }

              promises.push(Q(project.edjiSave()))

          }
      })
      return promises
  })
  .then((promises) => {
    Q.all(promises)
    .then(() => {
      return res.status(200).send()
    })
    .catch((err) => {
      throw new Error(err)
    })
  })
  .catch((err) => {
      console.error(err)
      return res.status(500).send()
  })
})