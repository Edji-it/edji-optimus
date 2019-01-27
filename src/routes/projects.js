// library imports
const express = require("express")
const mongoose = require("mongoose")
const Q = require("q")
const rp = require("request-promise")
const _ = require("underscore")
const sentry = require('@sentry/node')

// project imports
const Project = require("./../models/Project")
const Comment = require("./../models/Comment")
const cleanMongoValidationError = require('./../error-handlers/mongo-validation').cleanMongoValidationError
const MountModelToRouter = require("./MountModelToRouter")
const authRequired = require('./../middleware/auth-required')
const pipolog = require('./../pipolog').pipoLog

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

router.put("/:id", authRequired, function (req, res, next) {
    let user = req.user
    let id = req.params.id
    let project = req.body.project

    if (!project) {
        return res.status(400).send()
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send()
    }

    let update = _.pick(project, ['comments', 'answers', 'students_ids', 'temp_ids', 'heat_vision', 'tags', 'report_evals'])

    Project.findOneAndUpdate({ _id: id, teacher_id: user._id }, update, {
        new: true, runValidators: true, setDefaultsOnInsert: true
    })
        .then((project) => {
            // send 404 if the project doesn't exist
            if (!project) {
                return res.status(404).send()
            } else {
                res.status(200).send({ updated: update })
            }
        })
        .catch((err) => {
            next(err)
        })
})

router.put("/:id/user_id", authRequired, function (req, res, next) {
    let user = req.user
    let id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).send() }

    if (user.type === "temp") {
        update = { $addToSet: { temp_ids: user._id } }
    } else {
        update = { $addToSet: { students_ids: user._id } }
    }

    Project.findOneAndUpdate(
        {
            _id: id,
            teacher_id: { $not: { $eq: user._id } } // don't add a project owner to their own project as a student
        },
        update,
        { new: true }
    )
        .then((update) => {
            // log to pipo!
            pipolog({
                user_id: user._id,
                teacher: user._id.equals(update.teacher_id),
                hero: !!user.hero_status,
                event_name: 'reading_joined'
            })
                .catch((err) => {
                    console.error('error from pipo :(', err)
                })

            if (update) { return res.status(200).send() }
            else { return res.status(304).send() }
        })
        .catch((err) => {
            next(err)
        })
})

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

router.post("/:id/comments", authRequired, async function (req, res, next) {
    let _id = req.params.id
    let user = req.user

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        res.status(400).send()
        return
    }

    if (!req.body.comment) {
        res.status(400).send({ validationErrors: { comment: "required" } })
        return
    }

    if (!req.body.comment.user_id) { req.body.comment.user_id = user._id }
    if (!req.body.comment.author) { req.body.comment.author = user.fullname }
    let comment = Comment(req.body.comment)

    try {
        let project = await Project.findById({ _id })
        if (!project) {
            return res.status(404).send()
        }
        let currentComment = project.comments.id(comment._id) // if the comment already has an id, it already exists

        let successStatus // 200 if updating, 201 if creating
        if (currentComment) {
            // Preserve "createdAt"
            comment.createdAt = currentComment.createdAt
            Object.assign(currentComment, comment)
            successStatus = 200
        } else {
            project.comments.push(comment)
            successStatus = 201
        }

        await project.edjiSave()
        return res.status(successStatus).send({ comment: project.comments.id(comment._id) })
    } catch (error) {
        if (error.name === "ValidationError") {
            let validationErrors = cleanMongoValidationError(error)
            return res.status(406).send({ validationErrors })
        } else {
            return next(error)
        }
    }
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

router.put("/:project_id/comments/:comment_id", authRequired, function (req, res, next) {
    let user = req.user
    let project_id = req.params.project_id
    let comment_id = req.params.comment_id
    let comment_update = _.pick(req.body.comment, 'start', 'end', 'data', 'dataArray', 'url', 'author', 'text', 'loc')

    // if the comment doesn't contain any valid update properties, then we can tell the user
    if (!req.body.comment) {
        return res.status(400).send({ errors: { comment: "no valid update properties on comment" } })
    }

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" } })
        return
    } else if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        res.status(400).send({ errors: { commentId: "invalid" } })
        return
    }

    let query = {
        _id: project_id,
        comments: {
            $elemMatch: {
                _id: comment_id,
                user_id: user._id
            }
        }
    }

    // the project's id must match, and it must have a comment w/ correct id and user_id
    Project.findOne(query)
        .then((project) => {
            if (!project) {
                return res.status(404).send({ error: "project not found" })
            }

            let comment = project.comments.find((comm) => {
                return comm._id == comment_id
            })

            // if they both have urls and the the url is getting updated, clean up the asset at the url that is being overwritten
            if (comment.url && comment_update.url && comment_update.url != comment.url) {
                deleteFromS3(comment.url)
                    .then((body) => {
                        // do nothing here because we successfully deleted the object
                    })
                    .catch((err) => {
                        console.error(err)
                    })
            }

            // update the fields from the comment_update onto the comment
            Object.assign(comment, comment_update)

            // save the entire project (DON'T JUST SAVE THE COMMENT)
            project.edjiSave()
                .catch((err) => {
                    sentry.captureException(err)
                })

            return res.status(200).send({ comment: comment })

        })
        .catch((err) => {
            next(err)
        })
})

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

router.post("/:id/answers", authRequired, async function (req, res, next) {
    let _id = req.params.id
    let user = req.user

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        res.status(400).send()
        return
    }

    if (!req.body.answer) {
        res.status(400).send({ validationErrors: { answer: "required" } })
        return
    }

    if (!req.body.answer.user_id) { req.body.answer.user_id = user._id }
    if (!req.body.answer.author) { req.body.answer.author = user.fullname }
    let answer = Comment(req.body.answer)

    try {
        let project = await Project.findById({ _id })
        if (!project) {
            return res.status(404).send()
        }

        let currentAnswer = project.answers.id(answer._id) // if the answer already has an id, it already exists

        let successStatus // 200 if updating, 201 if creating
        if (currentAnswer) {
            // Preserve "createdAt"
            answer.createdAt = currentAnswer.createdAt
            Object.assign(currentAnswer, answer)
            successStatus = 200
        }
        else {
            project.answers.push(answer)
            successStatus = 201
        }

        project = await project.edjiSave()
        return res.status(successStatus).send({ answer: project.answers.id(answer._id) })
    } catch (error) {
        // constructs object with list of model-defined errors to send to user
        if (error.name === "ValidationError") {
            let validationErrors = cleanMongoValidationError(error)
            return res.status(406).send({ validationErrors })
        } else {
            return next(error)
        }
    }
})

router.put("/:project_id/answers/:answer_id", authRequired, async function (req, res, next) {
    let user = req.user
    let project_id = req.params.project_id
    let answer_id = req.params.answer_id
    let answer_update = _.pick(req.body.answer, 'start', 'end', 'data', 'dataArray', 'url', 'author', 'text', 'loc')

    // if the answer doesn't contain any valid update properties, then we can tell the user
    if (!req.body.answer) {
        return res.status(400).send({ errors: { answer: "no valid update properties on answer" } })
    }

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" } })
        return
    } else if (!mongoose.Types.ObjectId.isValid(answer_id)) {
        res.status(400).send({ errors: { answerId: "invalid" } })
        return
    }

    // the project's id must match, and it must have a answer w/ correct id and user_id
    Project.findOne({
        _id: project_id,
        answers: {
            $elemMatch: {
                _id: answer_id,
                user_id: user._id
            }
        }
    })
        .then((project) => {
            if (!project) {
                return res.status(404).send({ error: "project not found" })
            }

            let answer = project.answers.find((answer) => {
                return answer._id == answer_id
            })

            // if they both have urls and the the url is getting updated, clean up the asset at the url that is being overwritten
            if (answer.url && answer_update.url && answer_update.url != answer.url) {
                deleteFromS3(answer.url)
                    .then((body) => {
                        // do nothing here because we successfully deleted the comment
                    })
                    .catch((err) => {
                        console.error(err)
                    })
            }

            // update the fields from the answer_update onto the answer
            Object.assign(answer, answer_update)

            // save the entire project (DON'T JUST SAVE THE COMMENT)
            project.edjiSave()
                .catch((err) => {
                    sentry.captureException(err)
                })

            return res.status(200).send({ answer: answer })

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
