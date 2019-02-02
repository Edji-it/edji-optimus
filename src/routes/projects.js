// library imports
const express = require("express")
const mongoose = require("mongoose")
const Q = require("q")
const rp = require("request-promise-native")
const _ = require("underscore")

// project imports
const Project = require("./../models/Project")
const MountModelToRouter = require("./MountModelToRouter")
const authRequired = require('./../middleware/auth-required')
const pipolog = require('./../pipolog').pipoLog
const UpdateProjectControllers = require('./../api/v1/projects/update')

const router = express.Router()

MountModelToRouter(router, Project, "project", { read: false, list: false, delete: false })

router.get("/", authRequired, function (req, res, next) {

    var user = req.user

    Q(Project.find(
        { $or: [{ students_ids: user._id }, { temp_ids: user._id }] },
        'reading_id teacher_id label code types tags updatedAt createdAt',
        { sort: { createdAt: -1 } }
    )
        .populate('teacher_id', 'fullname email username')
        .populate('reading_id', 'title'))
        .then((projects) => {
            return res.status(200).send(projects)
        })
        .catch((err) => {
            next(err)
        })
})

/**
 * @deprecated 1/26/19
 */
router.post(
    "/",
    authRequired,
    // the new api endpoint does not use a nested project property, so this keeps us consistent during transition time
    (req, res, next) => {
        if (req.body && req.body.project) {
            req.body = req.body.project
        }
        next()
    },
    require('./../api/v1/projects/create').default
)

// currently only works for teacher deleting a project
router.delete("/:id", authRequired, function (req, res, next) {
    var id = req.params.id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).send()
        return
    }

    Project.deleteOne({ _id: req.params.id, teacher_id: user._id })
        .then((obj) => {
            if (obj.n < 1) {
                return res.status(404).send()
            } else {
                return res.status(204).send()
            }
        })
        .catch((err) => {
            next(err)
        })
})

/**
 * @deprecated 2/2/19
 */
router.put(
    '/:project_id',
    authRequired,
    (req, res, next) => { // currently the response body is not used on the front end so we don't need anything special for updating it
        const project = req.body.project
        req.body = project
        next()
    },
    UpdateProjectControllers.UpdateProjectController
)

/**
 * @deprecated 2/2/19
 */
router.post(
    '/:project_id/comments',
    authRequired,
    (req, res, next) => {
        // pull old comment out of body
        const comment = req.body.comment
        // reassign comment to body to be handled by new controller
        req.body = comment
        req.params.update_property = 'comments'
        // this is weird and stupid but we need to return { comment: [object] } as the body for this call and that's not how the new api works
        req.params.wrap_comment = true
        next()
    },
    // add PUT /api/v1/projects/:id/comments handler
    UpdateProjectControllers.UpdatePropertyController
)

/**
 * @deprecated 2/2/19
 */
router.put(
    '/:project_id/comments/:comment_id',
    authRequired,
    (req, res, next) => {
        // pull old comment out of body
        const comment = req.body.comment
        // reassign comment to body to be handled by new controller
        req.body = comment
        req.params.update_property = 'comments'
        req.params.wrap_comment = true
        next()
    },
    // add PUT /api/v1/projects/:id/comments handler
    UpdateProjectControllers.UpdatePropertyController
)

/**
 * @deprecated 2/2/19
 */
router.post(
    '/:project_id/answers',
    authRequired,
    (req, res, next) => {
        // pull old comment out of body
        const comment = req.body.comment
        // reassign comment to body to be handled by new controller
        req.body = comment
        req.params.update_property = 'answers'
        // this is weird and stupid but we need to return { comment: [object] } as the body for this call and that's not how the new api works
        req.params.wrap_comment = true
        next()
    },
    // add PUT /api/v1/projects/:id/answers handler
    UpdateProjectControllers.UpdatePropertyController
)

/**
 * @deprecated 2/2/19
 */
router.put(
    '/:project_id/answers/:comment_id',
    authRequired,
    (req, res, next) => {
        // pull old comment out of body
        const comment = req.body.comment
        // reassign comment to body to be handled by new controller
        req.body = comment
        req.params.update_property = 'answers'
        req.params.wrap_comment = true
        next()
    },
    // add PUT /api/v1/projects/:id/answers handler
    UpdateProjectControllers.UpdatePropertyController
)

/**
 * @deprecated 2/2/19
 */
router.put(
    '/:project_id/user_id',
    authRequired,
    (req, res, next) => {
        req.params.update_property = 'students'
        next()
    },
    UpdateProjectControllers.UpdatePropertyController
)

// get projects for a single reading id
router.get("/reading/:reading_id", authRequired, function (req, res, next) {
    var reading_id = req.params.reading_id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(reading_id)) {
        return res.status(400).send()
    }

    Project.find(
        { reading_id: reading_id, teacher_id: user._id },
        {},
        // 'reading_id teacher_id label code types updatedAt createdAt',
        { sort: { createdAt: -1 } }
    )
        .then((projects) => {
            res.status(200).send({ projects: projects })
        })
        .catch((err) => {
            next(err)
        })
})

/**
 * Sets up the options and returns a promise which will call grapple's route to delete an asset from s3
 * @param url The url of the asset to delete (typically looks like //images.edji.it/something)
 * @returns Promise resolved with a response body from Grapple
 */
let deleteFromS3 = function (url) {
    let options = {
        method: 'DELETE',
        uri: [process.env.EDJI_GRAPPLE_DOMAIN, "v1", "s3", encodeURIComponent(url)].join("/"),
        headers: { Authorization: process.env.EDJI_GRAPPLE_TOKEN },
        json: true
    }

    return rp(options)
}

router.delete("/:project_id/comments/:comment_id", authRequired, function (req, res, next) {
    let user = req.user
    let project_id = req.params.project_id
    let comment_id = req.params.comment_id

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" } })
        return
    } else if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        res.status(400).send({ errors: { commentId: "invalid" } })
        return
    }

    Q(Project.findOneAndUpdate(
        {
            _id: project_id,
            $or: [
                { teacher_id: user._id }, // this lets teachers delete a student's comment
                {
                    comments: {
                        $elemMatch: { // this is likely a student deleting their own comment
                            _id: comment_id,
                            user_id: user._id
                        }
                    }
                }
            ]
        }, {
            $pull: {
                comments: {
                    _id: comment_id
                }
            }
        }, {
        })
        .exec())
        .then((project) => { // the project that gets passed is the project before the update

            if (!project) {
                res.status(404).send()
            } else {
                // go through and find the comment that should have been deleted
                modComment = project.comments.find((comment) => {
                    return comment._id == comment_id
                })

                // if the old comment had a url, we need to delete that asset
                if (modComment && modComment.url) {
                    deleteFromS3(modComment.url)
                        .then((body) => { // { deleted_url: string[] }
                            return res.status(200).send({ deleted_comment: modComment })
                        })
                        .catch((err) => {
                            return res.status(err.statusCode).send(err)
                        })
                } else {
                    return res.status(200).send({ deleted_comment: modComment })
                }
            }
        })
        .catch((err) => {
            next(err)
        })
})

router.delete("/:project_id/answers/:answer_id", authRequired, function (req, res, next) {
    let user = req.user
    let project_id = req.params.project_id
    let answer_id = req.params.answer_id

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        return res.status(400).send({ errors: { projectId: "invalid" } })
    } else if (!mongoose.Types.ObjectId.isValid(answer_id)) {
        return res.status(400).send({ errors: { answerId: "invalid" } })
    }

    Project.findOneAndUpdate(
        {
            _id: project_id,
            $or: [
                { teacher_id: user._id }, // this lets teachers delete a student's answer
                {
                    answers: {
                        $elemMatch: { // this is likely a student deleting their own answer
                            _id: answer_id,
                            user_id: user._id
                        }
                    }
                }
            ]
        }, {
            $pull: {
                answers: {
                    _id: answer_id
                }
            }
        }, {
        })
        .then((project) => { // the project that gets passed is the project before the update

            if (!project) {
                res.status(404).send()
            } else {
                // go through and find the answer that should have been deleted
                modAnswer = project.answers.find((answer) => {
                    return answer._id == answer_id
                })

                // if the old answer had a url, we need to delete that asset
                if (modAnswer && modAnswer.url) {
                    deleteFromS3(modAnswer.url)
                        .then((body) => { // { deleted_url: string[] }
                            return res.status(200).send({ deleted_answer: modAnswer })
                        })
                        .catch((err) => {
                            return res.status(err.statusCode).send(err)
                        })
                } else {
                    return res.status(200).send({ deleted_answer: modAnswer })
                }
            }
        })
        .catch((err) => {
            next(err)
        })
})

router.get("/:project_code/validate", function (req, res, next) {
    var project_code = req.params.project_code.toLowerCase()

    Q(Project.findOne({ code: project_code }, "_id").exec()).then(function (project) {
        if (project) {
            res.status(200).send({ _id: project._id })
        } else {
            res.status(404).send()
        }
    })
        .catch((err) => {
            next(err)
        })
})

module.exports = router
