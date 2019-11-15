// library imports
const express = require('express')
const mongoose = require('mongoose')

// project imports
const Project = require('./../models/Project').default
const authRequired = require('./../middleware/auth-required')
const { RemovePropertyController } = require('./../api/v1/projects/remove-property')

const router = express.Router()

/**
 * @deprecated 4/2/19
 */
router.delete(
  '/:project_id',
  authRequired,
  require('./../middleware/validate-ids').validateIdParameters(':project_id'),
  require('./../models/_Project').deleteOwnerProject(),
  require('./../middleware/handle-http').sendResponse(),
)

// get projects for a single reading id
router.get('/reading/:reading_id', authRequired, function(req, res, next) {
  var reading_id = req.params.reading_id
  var user = req.user

  if (!mongoose.Types.ObjectId.isValid(reading_id)) {
    return res.status(400).send()
  }

  Project.find(
    { reading_id: reading_id, teacher_id: user._id },
    {},
    // 'reading_id teacher_id label code types updatedAt createdAt',
    { sort: { createdAt: -1 } },
  )
    .then(projects => {
      res.status(200).send({ projects: projects })
    })
    .catch(err => {
      next(err)
    })
})

/**
 * @deprecated 3/16/19
 */
router.delete(
  '/:project_id/comments/:comment_id',
  authRequired,
  (req, res, next) => {
    req.params.remove_property = 'comments'
    next()
  },
  RemovePropertyController,
)

/**
 * @deprecated 3/16/19
 */
router.delete(
  '/:project_id/answers/:comment_id',
  authRequired,
  (req, res, next) => {
    req.params.remove_property = 'answers'
    next()
  },
  RemovePropertyController,
)

/**
 * @deprecated 3/14/19
 */
router.get('/:project_code/validate', function(req, res, next) {
  var project_code = req.params.project_code.toLowerCase()

  Project.findOne({ code: project_code }, '_id')
    .then(function(project) {
      if (project) {
        res.status(200).send({ _id: project._id })
      } else {
        res.status(404).send()
      }
    })
    .catch(err => {
      next(err)
    })
})

module.exports = router
