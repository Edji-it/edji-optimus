// library imports
let express = require( "express")
let mongoose = require( "mongoose")
let Q = require("q")
let rp = require("request-promise")
const _ = require("underscore")

// project imports
let Project = require("./../models/Project")
let Comment = require("./../models/Comment")
let User = require("./../models/User")
let MountModelToRouter = require("./MountModelToRouter")
const authRequired = require('./../middleware/auth-required')
const pipolog = require('./../pipolog').pipoLog

let router = express.Router()

MountModelToRouter(router, Project, "project", {read:false, list:false, delete:false})

router.get("/", authRequired, function(req, res){

    var user = req.user

    Q(Project.find(
        { $or: [{students_ids: user._id}, {temp_ids: user._id}] },
        'reading_id teacher_id label code types tags updatedAt createdAt',
        { sort: { createdAt: -1 } }
    )
    .populate('teacher_id','fullname email username')
    .populate('reading_id','title'))
    .then((projects) => {
        return res.status(200).send(projects)
    })
    .catch((err) => {
        console.error(err)
        return res.status(500).send()
    })
})

router.post("/", authRequired, function(req, res) {
    var project = req.body.project

    if (!project) {
        res.status(400).send({ validationErrors: { project: "required" } })
        return
    }

    // if a specific id isn't passed, go ahead and set it as the creating user's id
    if (!project.teacher_id) {
        project.teacher_id = req.user._id
    }

    var model = Project(project)

    model.edjiSave(false, function(error, result) {
        if (error) {
            // constructs object with list of model-defined errors to send to user
            if (error.name === "ValidationError") {
                var errors = {}

                for (var property in error.errors) {
                    if (error.errors[property].kind === "user defined") {
                        errors[property] = error.errors[property].properties.kind
                    } else {
                        errors[property] = error.errors[property].kind
                    }
                }

                res.status(406).send({ validationErrors: errors })
                return
            } else {
                res.status(500).send(error)
                return
            }
        } else {
            res.status(201).send({ project: result })
        }
    })
})

router.get("/:id", function(req, res) {
    let id = req.params.id
    let user = req.user
    let populate = req.query.pop || []
    if (typeof populate == 'string') { // otherwise it's going to be an array of strings, which is what we want
        populate = [populate]
    }

    let findParams = {}

    //creates flexibility to use with either project code or with project id
    if (mongoose.Types.ObjectId.isValid(id)) {
        findParams._id = id
    } else {
        findParams.code = id.toLowerCase()
    }

    Q(Project.findOne(findParams)
            .populate(populate.indexOf("reading_id") > -1 ? 'reading_id' : "", "words title owner_id teacher_ids public promoter_ids source cover_img tags draft version_id questions parent_id") // populate the reading_id if it was provided to query
            .exec()
        )
        .then((project) => {
            return Q(Project.populate(project, { path: 'teacher', select: 'fullname username' }))
        })
        .then((project) => {

            if (!project) {
                res.status(404).send()
                return
            }

            // to have a list of students who have been to a reading, regardless of whether or not they comment,
            //  we add them to the temp_ids or students_ids array
            if (user) {
                // don't add the teacher to the students array of their own project
                if (!user._id.equals(project.teacher_id)) {
                    let logJoinToPipo = false
                    if (user.type && user.type === "temp") {
                        // only add the user's id if it's not already in the project
                        if (project.temp_ids.indexOf(req.user._id) < 0) {
                            project.temp_ids.push(req.user._id)
                            logJoinToPipo = true
                        }

                        // should call update here
                    } else {
                        // only add the user's id if it's not already in the project
                        if (project.students_ids.indexOf(req.user._id) < 0) {
                            project.students_ids.push(req.user._id)
                            logJoinToPipo = true
                        }
                    }

                    if (logJoinToPipo) {
                        pipolog({
                            user_id: user._id,
                            teacher: user._id.equals(project.teacher_id),
                            hero: !!user.hero_status,
                            event_name: 'reading_joined'
                        })
                        .catch((err) => {
                            console.error('error from pipo :(', err)
                        })
                    }
                }
            }

            // here we're going to do a little curation for the returned project to make sure the comments come back with a replies array
            var repliesObj = []
            let size = project.comments.length
            for (let i = 0; i < size; i++) {
                let comment = project.comments[i]
                if (comment.reply_to) {
                    if (!repliesObj[comment.reply_to]) {
                        repliesObj[comment.reply_to] = []
                    }

                    repliesObj[comment.reply_to].push(comment._id)
                }
            }

            // assign the array of reply _id's to the applicable comment
            for (let reply_to_id in repliesObj) {
                let comment = project.comments.find((comment) => {
                    return comment._id == reply_to_id
                })
                if (comment) {
                    comment.replies = repliesObj[reply_to_id]
                }
            }

            res.status(200).send({ project: project })

            // we save it afterward so that we don't obstruct returning the data
            //  if this fails, we won't have their username in the array, but oh well
            project.edjiSave(false, (err) => {
                if (err) {
                    console.error(err)
                }
            })
        })
        .catch((error) => {
            console.error(error)
            res.status(500).send()
        })
})

// currently only works for teacher deleting a project
router.delete("/:id", authRequired, function(req, res) {
    var id = req.params.id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).send()
        return
    }

    Project.deleteOne({_id:req.params.id, teacher_id: user._id})
    .then((obj) => {
        if (obj.n < 1) {
            return res.status(404).send()
        } else {
            return res.status(204).send()
        }
    })
    .catch((err) => {
        console.error(err)
        return res.status(500).send()
    })
})

router.put("/:id", authRequired, function(req, res) {
    let user = req.user
    let id = req.params.id
    let project = req.body.project

    if (!project) {
        res.status(400).send()
        return
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).send()
        return
    }

    let update = _.pick(project, ['comments', 'answers', 'students_ids', 'temp_ids', 'heat_vision', 'tags', 'report_evals'])

    Q(Project.findOneAndUpdate({ _id: id, teacher_id: user._id }, update, {
        new: true, runValidators: true, setDefaultsOnInsert: true
    }).exec())
    .then((project) => {
        // send 404 if the project doesn't exist
        if (!project) {
            res.status(404).send()
            return
        } else {
            res.status(200).send({ project: project })
        }
    })
    .catch((err) => {
        console.error(err)
        res.status(500).send()
    })
})

router.put("/:id/user_id", authRequired, function(req, res) {
    let user = req.user
    let id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).send() }

    if (user.type === "temp") {
        update = { $addToSet: { temp_ids: user._id }}
    } else {
        update = { $addToSet: { students_ids: user._id }}
    }

    Q(
        Project.findOneAndUpdate(
            {
                _id: id,
                teacher_id: { $not: { $eq: user._id }} // don't add a project owner to their own project as a student
            },
            update,
            { new: true }
        )
        .exec()
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
        console.error(err)
        return res.status(500).send()
    })
})

// get projects for a single reading id
router.get("/reading/:reading_id", authRequired, function(req, res){
    var reading_id = req.params.reading_id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(reading_id)) {
        res.status(400).send()
        return
    }

    Project.find(
        { reading_id: reading_id, teacher_id: user._id },
        {},
        // 'reading_id teacher_id label code types updatedAt createdAt',
        { sort: { createdAt: -1 } },
        (error, projects) => {
            if (error) {
                console.error(error)
                res.status(500).send()
            } else {
                res.status(200).send({ projects: projects })
            }
        }
    )
})

router.post("/:id/comments", authRequired, function(req, res) {
    var _id = req.params.id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        res.status(400).send()
        return
    }

    if (!req.body.comment) {
        res.status(400).send({ validationErrors: { comment: "required" }})
        return
    }
    
    if (!req.body.comment.user_id) { req.body.comment.user_id = user._id }
    if (!req.body.comment.author) { req.body.comment.author = user.fullname }
    var comment = Comment(req.body.comment)

    //comment.user_id = req.logged_in_user.user_id
    Project.findById({_id}, function(err, project){
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        } else if (!project) {
            res.status(404).send()
            return
        } else {
            var currentComment = project.comments.id(comment._id) // if the comment already has an id, it already exists

            var successStatus // 200 if updating, 201 if creating
            if (currentComment){
                // Preserve "createdAt"
                comment.createdAt = currentComment.createdAt
                Object.assign(currentComment, comment)
                successStatus = 200
            }
            else{
                project.comments.push(comment)
                successStatus = 201
            }

            project.edjiSave(false, function(error, project){
                if (error) {
                    // constructs object with list of model-defined errors to send to user
                    if (error.name === "ValidationError") {
                        var errors = {}

                        for (var property in error.errors) {
                            if (error.errors[property].kind === "user defined") {
                                errors[property] = error.errors[property].properties.kind
                            } else {
                                errors[property] = error.errors[property].kind
                            }
                        }

                        res.status(406).send({ validationErrors: errors })
                        return
                    } else {
                        res.status(500).send(error)
                        return
                    }
                } else { res.status(successStatus).send({ comment: project.comments.id(comment._id) }) }
                    
            })
        }
        
    })
})

/**
 * Sets up the options and returns a promise which will call grapple's route to delete an asset from s3
 * @param url The url of the asset to delete (typically looks like //images.edji.it/something)
 * @returns Promise resolved with a response body from Grapple
 */
let deleteFromS3 = function(url) {
    let options = {
        method: 'DELETE',
        uri: [process.env.EDJI_GRAPPLE_DOMAIN, "v1", "s3", encodeURIComponent(url)].join("/"),
        headers: { Authorization: process.env.EDJI_GRAPPLE_TOKEN },
        json: true
    }

    return rp(options)
}

router.put("/:project_id/comments/:comment_id", authRequired, function(req, res) {
    let user = req.user
    let project_id = req.params.project_id
    let comment_id = req.params.comment_id
    let comment_update = _.pick(req.body.comment, 'start', 'end', 'data', 'dataArray', 'url', 'author', 'text', 'loc')

    // if the comment doesn't contain any valid update properties, then we can tell the user
    if (!req.body.comment) {
        return res.status(400).send({ errors: { comment: "no valid update properties on comment" }})
    }

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" }})
        return
    } else if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        res.status(400).send({ errors: { commentId: "invalid" }})
        return
    }

    let query = {
        _id: project_id,
        comments: { $elemMatch: {
            _id: comment_id,
            user_id: user._id
        }}
    }

    // the project's id must match, and it must have a comment w/ correct id and user_id
    Q(  Project.findOne(query)
        .exec())
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
            project.edjiSave(false, (err, doc) => {
                if (err) { console.error(err) }
                else { /** do nothing */ }
            })

            return res.status(200).send({ comment: comment })

        })
        .catch((err) => {
            console.error(err)
            res.status(500).send()
        })
})

router.delete("/:project_id/comments/:comment_id", authRequired, function(req, res){
    let user = req.user
    let project_id = req.params.project_id
    let comment_id = req.params.comment_id

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" }})
        return
    } else if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        res.status(400).send({ errors: { commentId: "invalid" }})
        return
    }

    Q(Project.findOneAndUpdate(
        {
            _id: project_id,
            $or: [ 
                { teacher_id: user._id }, // this lets teachers delete a student's comment
                { comments: { $elemMatch: { // this is likely a student deleting their own comment
                    _id: comment_id,
                    user_id: user._id
                }}}
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
        .catch((error) => {
            console.error(error)
            res.status(500).send()
        })
})

router.post("/:id/answers", authRequired, function(req, res) {
    var _id = req.params.id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        res.status(400).send()
        return
    }

    if (!req.body.answer) {
        res.status(400).send({ validationErrors: { answer: "required" }})
        return
    }
    
    if (!req.body.answer.user_id) { req.body.answer.user_id = user._id }
    if (!req.body.answer.author) { req.body.answer.author = user.fullname }
    var answer = Comment(req.body.answer)

    // find the project id 
    Project.findById({_id}, function(err, project){
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        } else if (!project) {
            res.status(404).send()
            return
        } else {
            var currentAnswer = project.answers.id(answer._id) // if the answer already has an id, it already exists
            
            var successStatus // 200 if updating, 201 if creating
            if (currentAnswer){
                // Preserve "createdAt"
                answer.createdAt = currentAnswer.createdAt
                Object.assign(currentAnswer, answer)
                successStatus = 200
            }
            else{
                project.answers.push(answer)
                successStatus = 201
            }

            project.edjiSave(false, (error, project) => {
                if (error) {
                    // constructs object with list of model-defined errors to send to user
                    if (error.name === "ValidationError") {
                        var errors = {}

                        for (var property in error.errors) {
                            if (error.errors[property].kind === "user defined") {
                                errors[property] = error.errors[property].properties.kind
                            } else {
                                errors[property] = error.errors[property].kind
                            }
                        }

                        res.status(406).send({ validationErrors: errors })
                        return
                    } else {
                        res.status(500).send(error)
                        return
                    }
                } else { res.status(successStatus).send({ answer: project.answers.id(answer._id) }) }
                    
            })
        }
    })
})

router.put("/:project_id/answers/:answer_id", authRequired, function(req, res) {
    let user = req.user
    let project_id = req.params.project_id
    let answer_id = req.params.answer_id
    let answer_update = _.pick(req.body.answer, 'start', 'end', 'data', 'dataArray', 'url', 'author', 'text', 'loc')

    // if the answer doesn't contain any valid update properties, then we can tell the user
    if (!req.body.answer) {
        return res.status(400).send({ errors: { answer: "no valid update properties on answer" }})
    }

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" }})
        return
    } else if (!mongoose.Types.ObjectId.isValid(answer_id)) {
        res.status(400).send({ errors: { answerId: "invalid" }})
        return
    }

    // the project's id must match, and it must have a answer w/ correct id and user_id
    Q(  Project.findOne({
            _id: project_id,
            answers: { $elemMatch: {
                _id: answer_id,
                user_id: user._id
            }}
        })
        .exec())
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

            // save the entire project (DON'T JUST SAVE THE ANSWER)
            project.edjiSave(false, (err, doc) => {
                if (err) { console.error(err) }
                else { /** do nothing b/c it worked */ }
            })

            return res.status(200).send({ answer: answer })

        })
        .catch((err) => {
            console.error(err)
            res.status(500).send()
        })
})

router.delete("/:project_id/answers/:answer_id", authRequired, function(req, res){
    let user = req.user
    let project_id = req.params.project_id
    let answer_id = req.params.answer_id

    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ errors: { projectId: "invalid" }})
        return
    } else if (!mongoose.Types.ObjectId.isValid(answer_id)) {
        res.status(400).send({ errors: { answerId: "invalid" }})
        return
    }

    Q(Project.findOneAndUpdate(
        {
            _id: project_id,
            $or: [ 
                { teacher_id: user._id }, // this lets teachers delete a student's answer
                { answers: { $elemMatch: { // this is likely a student deleting their own answer
                    _id: answer_id,
                    user_id: user._id
                }}}
            ]
        }, {
            $pull: {
                answers: {
                    _id: answer_id
                }
            }
        }, {
        })
        .exec())
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
        .catch((error) => {
            console.error(error)
            res.status(500).send()
        })
})

router.get("/:project_code/validate", function(req, res) {
    var project_code = req.params.project_code.toLowerCase()

    Q(Project.findOne({code:project_code}, "_id").exec()).then(function(project) {
        if (project) {
            res.status(200).send({ _id : project._id })
        } else {
            res.status(404).send()
        }
    })
    .catch(function(err) {
        console.error(err)
        res.status(500).send()
    })
})

module.exports = router
