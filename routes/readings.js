/**
 * Created by bvfergus on 3/5/16.
 */
const express = require( "express")
const mongoose = require( "mongoose")
const Q = require("q")
let Reading = require("./../models/Reading")
let Project = require("./../models/Project")
let User = require("./../models/User")
let ReadingVersion = require("./../models/ReadingVersion")
let MountModelToRouter = require("./MountModelToRouter")
let Middleware = require("./../middleware/Middleware")

var router = express.Router()

router.post("/", Middleware.authRequired, function(req, res) {
    let reading = req.body.reading
    let user = req.user

    if (!reading) {
        res.status(400).send({ validationErrors: { reading: "required" } })
        return
    }

    // if the original owner is not the user, we need to create a new version_id to keep track of this user's version separately
    // this means that, if we don't receive an owner_id with the call, we will attribute this to a new version
    //  if it doesn't come with a version_id attached, we assume it's the first version and add a record to the linking table
    //  all we have to do is give it the version id, because later we'll create the ReadingVersion based on this id
    let makeNewVersionId = false
    if (!reading.owner_id || reading.owner_id != user._id || !reading.version_id) { reading.version_id = mongoose.Types.ObjectId() }

    // going to just always set owner_id for now. don't see any reason that the front end would set it
    reading.owner_id = user._id

    // Readings show on a Teacher's dashboard if they exist in the teacher_ids array
    // Even the owner needs to exist in this array (since an owner can later abandon a reading but teachers or students can continue using it)
    reading.teacher_ids = []
    reading.teacher_ids.push(user._id)
    
    let model = Reading(reading)

    let errors = {}
    model.validate((error) => {
        if (error) {
            // constructs object with list of model-defined errors to send to user
            if (error.name === "ValidationError") {

                for (var property in error.errors) {
                    if (error.errors[property].kind === "user defined") {
                        errors[property] = error.errors[property].properties.kind
                    } else {
                        errors[property] = error.errors[property].kind
                    }
                }

                return res.status(406).send({ validationErrors: errors })
            }
        } else {
            // first, make the necessary update to the version in the linking table
            // the upsert: true makes sure that, if the version_id doesn't exist, it gets created
            Q(ReadingVersion.findOneAndUpdate({ // we can't use save here because of the special $push operation
                    _id: model.version_id,
                    owner_id: user._id
                }, {
                    $push: { readings: model._id },
                    updatedAt: Date.now()
                }, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true })
                .exec())
                .then((version) => {
                    // This call will always overwrite (avoiding performance issues with findOneAndUpdate)
                    model.forceSave((error, result) => {
                        if (error) {
                            console.error(error)
                            return res.status(500).send()
                        } else {
                            return res.status(201).send({ reading: { _id: result._id, version_id: result.version_id, success: true } })
                        }
                    })
                })
                .catch((err) => {
                    console.error(err)
                    res.status(500).send()
                })
        }
    })
})

// Update a reading if in draft
router.put("/:reading_id", Middleware.authRequired, function(req, res) {
    var reading_upd = req.body.reading
    var reading_id = req.params.reading_id
    var user = req.user

    if (!reading_upd) { return res.status(400).send() }

    // Validate the reading ID is of the proper type
    if (!mongoose.Types.ObjectId.isValid(reading_id)) {
        // If the reading id is not a valid mongo id
        return res.status(400).send()
    }

    // now we need to make sure they are not trying to update anything we don't want them to
    validProperties = ["html", "words", "title", "public", "source", "cover_img", "tags", "draft", "questions"]
    let invalidProperties = []
    for (let property in reading_upd) {
        if (validProperties.indexOf(property) < 0) {
            invalidProperties.push(property)
        }
    }

    if (invalidProperties.length > 0) {
        return res.status(400).send({ validationErrors: { invalidProperties: invalidProperties }})
    }

    Q(Reading.findById(reading_id).exec())
        .then((result) => {
            if (!result) { return res.status(404).send() }
            if (result.owner_id != user._id) { return res.status(401).send() }

            Object.assign(result, reading_upd)
            result.save(false, (err) => {
                if (err) {
                    console.error(err)
                    return res.status(500).send()
                } else {
                    return res.status(200).send({ reading: result })
                }
            })
        })
        .catch((err) => {
            console.error(err)
            return res.status(500).send()
        })
})

router.delete("/:id", Middleware.authRequired, function(req, res) {
    let id = req.params.id
    let user = req.user

    // Validate the reading ID is of the proper type
    if (!mongoose.Types.ObjectId.isValid(id)) {
        // If the reading id is not a valid mongo id
        return res.status(400).send()
    }

    let promises = []
    // remove all of the readings with the same id
    promises.push(Reading.remove({ _id: id, owner_id: user._id }).exec())
    // remove all projects associated with the reading
    promises.push(Project.remove({ reading_id: id, teacher_id: user._id }).exec())
    // remove the version id from all the version id places
    promises.push(ReadingVersion.update(
        { readings: id, owner_id: user._id },
        { $pull: { readings: id }},
        {}
    ).exec())

    // run all of the promises and return to client
    Q.all(promises)
        .then((responses) => {

            // if the delete reading response indicates that a reading has been deleted, assign properties and return 200
            if (responses.length && responses[0].result && responses[0].result.n > 0) {
                let delReadings = responses[0].result.n
                let delProjects = responses[1].result.n

                return res.status(200).send({ results: {
                    deletedReadings: delReadings,
                    deletedProjects: delProjects
                }})
            } else {
                return res.status(404).send()
            }

        })
        .catch((err) => {
            console.error(err)
            return res.status(500).send()
        })
})

router.get("/versions/:version_id", Middleware.authRequired, function(req, res) {
    let version_id = req.params.version_id
    let user = req.user

    // Validate the reading ID is of the proper type
    if (!mongoose.Types.ObjectId.isValid(version_id)) {
        // If the reading id is not a valid mongo id
        return res.status(400).send()
    }

    let promises = [
        Project.aggregate([
            { $match: { $or: [{ teacher_id: user._id.toString() }, { students_ids: user._id.toString() }, { temp_ids: user._id.toString() }]}},
            { $project: {
                teacher_id: 1, reading_id: 1, label: 1, code: 1, types: 1, createdAt: 1, updatedAt: 1,
                comment_count: { $size: { $ifNull: [ "$comments", [] ]}},
                student_count: { $sum: [{ $size: { $ifNull: ["$students_ids", [] ]}}, { $size: { $ifNull: ["$temp_ids", [] ]}}] }
            }}
        ]).exec(),
        ReadingVersion.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(version_id) }},
            { $unwind: "$readings" },
            { $project: {
                _id: "$readings"
            }},
            { $lookup: {
                from: "readings",
                localField: "_id",
                foreignField: "_id",
                as: "reading"
            }},
            { $unwind: "$reading" },
            { $project: {
                _id: "$reading._id",
                title: "$reading.title",
                owner_id: "$reading.owner_id",
                teacher_ids: "$reading.teacher_ids",
                "public": "$reading.public",
                source: "$reading.source",
                cover_img: "$reading.cover_img",
                draft: "$reading.draft",
                createdAt: "$reading.createdAt",
                updatedAt: "$reading.updatedAt",
                versionCount: 1
            }},
            { $sort: { _id: -1 }}
        ])
    ]

    Q.all(promises)
        .then((results) => {
            var projects = results[0]
            var readings = results[1]

            readings.forEach((reading, index) => {
                readings[index].projects = projects.filter((project) => {
                    if (project.reading_id == reading._id.toString()) { return true }
                    else { return false }
                })
            })
            if (readings.length < 1) { return res.status(404).send() }

            // check the first reading's owner_id to see if it matches the user._id
            if (readings[0].owner_id != user._id) { return res.status(401).send() }
            res.status(200).send({readings})
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send()
        })
})

router.get("/all/projects", Middleware.authRequired, function(req, res) {
    var user = req.user

    let promises = [
        Project.aggregate([
            { $match: { $or: [{ teacher_id: user._id.toString() }, { students_ids: user._id.toString() }, { temp_ids: user._id.toString() }]}},
            { $project: {
                teacher_id: 1, reading_id: 1, label: 1, code: 1, types: 1, createdAt: 1, updatedAt: 1,
                comment_count: { $size: { $ifNull: [ "$comments", [] ]}},
                student_count: { $sum: [{ $size: { $ifNull: ["$students_ids", [] ]}}, { $size: { $ifNull: ["$temp_ids", [] ]}}] }
            }}
        ]).exec(),
        ReadingVersion.aggregate([
            { $match: { owner_id: user._id }},
            { $project: {
                versionCount: { $size: "$readings" },
                readings: 1,
                updatedAt: 1
            }},
            { $unwind: "$readings" },
            { $group: {
                _id: "$_id",
                reading: { $last: "$readings" },
                versionCount: { $last: "$versionCount" },
                updatedAt: { $last: "$updatedAt" },
                promoter_count: { $last: "$promoter_count" }
            }},
            { $sort: { "updatedAt": -1 } },
            { $lookup: {
                from: "readings",
                localField: "reading",
                foreignField: "_id",
                as: "reading"
            }},
            { $unwind: "$reading"},
            { $project: {
                _id: "$reading._id",
                title: "$reading.title",
                owner_id: "$reading.owner_id",
                teacher_ids: "$reading.teacher_ids",
                "public": "$reading.public",
                source: "$reading.source",
                cover_img: "$reading.cover_img",
                draft: "$reading.draft",
                version_id: "$reading.version_id",
                createdAt: "$reading.createdAt",
                updatedAt: "$reading.updatedAt",
                versionCount: 1
            }}
        ])
    ]

    Q.all(promises)
        .then((results) => {
            var projects = results[0]
            var readings = results[1]

            readings.forEach((reading, index) => {
                readings[index].projects = projects.filter((project) => {
                    if (project.reading_id == reading._id.toString()) { return true }
                    else { return false }
                })
            })

            res.status(200).send({readings})
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send()
        })
})

// Get all Readings from users that requesting user follows
router.get("/feed", function(req, res) {
    let user = req.user

    // allowable parameters
    let allowedTypes = [
        'public',
        'following'
    ]
    let allowedSubjects = [
        // nothing here yet!
    ]

    // query parameter setting
    let type = req.query.type || 'public'
    let size = req.query.size || 15
    let start = req.query.start || 0
    let grade = req.query.grade
    let subjects = req.query.subjects || []

    // query parameter validation
    let errors = []

    if (allowedTypes.indexOf(type) < 0) {
        errors.push({
            parameter: 'type',
            message: 'supplied type not allowed',
            value: type
        })
    }

    if (size < 0 || size > 100) {
        errors.push({
            parameter: 'size',
            message: 'supplied size out of bounds',
            value: size
        })
    }

    if (start < 0) {
        errors.push({
            parameter: 'start',
            message: 'supplied start out of bounds',
            value: start
        })
    }

    if (grade && (grade < 0 || grade > 13)) {
        errors.push({
            parameter: 'grade',
            message: 'supplied grade out of bounds',
            value: grade
        })
    }

    let disallowedSubjects = []
    for (let sub in subjects) {
        if (allowedSubjects.indexOf(sub) < 0) {
            disallowedSubjects.push(sub)
        }
    }

    if (disallowedSubjects.length > 0) {
        for (let sub in disallowedSubjects) {
            errors.push({
                parameter: 'subjects',
                message: 'supplied subjects contains value not allowed in subjects field',
                value: sub
            })
        }
    }

    // stop execution if there are any errors
    if (errors.length > 0) { return res.status(400).send({ errors: errors }) }

    let followedUsers
    if (user && user.following) {
        followedUsers = user.following
    } else {
        followedUsers = []
    }

    // now build us a query
    let readingQuery = {
        $or: [], // these will be deleted if left empty
        $and: []
    }

    switch (type) {
        case 'public':
            readingQuery.public = true
            break
        case 'following':
            let len = followedUsers.length
            for (let i = 0; i < len; i++) {
                readingQuery.$or.push({ "owner_id" : followedUsers[i] })
            }
            break
    }

    // set grade level if it is given
    grade && (readingQuery.grade_level = grade)
    if (subjects.length > 0) {
        for (let sub in subjects) {
            readingQuery.$or.push({ subject: sub })
        }
    }

    // either of these will throw an error if they're left empty
    if (readingQuery.$or.length < 1) {
        delete readingQuery.$or
    }
    if (readingQuery.$and.length < 1) {
        delete readingQuery.$and
    }

    let fieldsToReturn = [
        'title',
        'owner_id',
        'teacher_ids',
        'public',
        'promoter_ids',
        'source',
        'cover_img',
        'tags',
        'draft',
        'version_id'
    ]

    Q(
        Reading.find(
            readingQuery,
            fieldsToReturn.join(' '),
            { skip: start, limit: size }
        )
        .sort({createdAt: -1})
        .populate('owner_id','fullname username')
        .exec()
    ).then((results) => {
        console.log(results)
        res.status(200).send({results})
    })
    .catch((err) => {
        console.error(err)
        res.status(500).send()
    })
})

// //allows teachers to recommend reading to community library
// router.put("/:reading_id/recommend", Middleware.authRequired, function(req, res) {
//     var reading_id = req.params.reading_id
//     var user = req.user

//     Reading.findById(reading_id, function(error, reading) {
//         error && console.log(error)

//         if (reading) {
//             if (!reading.promoter_ids) { //update older readings
//                 reading.promoter_ids = []
//             } else if (reading.promoter_ids.indexOf(user._id) >= 0) {
//                 res.status(304).send()
//                 return
//             }

//             reading.promoter_ids.push(user._id)

//             reading.save()
//             res.status(204).send()
//         }
//     })
// })

MountModelToRouter(router, Reading, "reading", { list: false, read: true, delete: false, create:false })

module.exports = router
