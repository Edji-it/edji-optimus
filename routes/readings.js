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

/**
 * Pass in query parameters and receive an array of errors if there is an error, and false if no errors
 *  it also makes a few changes to clean the data on the query parameters supplied
 * @param {any} query The query parameters from the req object
 */
let validateAndCleanSearchParams = function(query) {
    // allowable parameters
    let allowedTypes = [
        'following'
    ]
    let allowedSubjects = [
        // nothing here yet!
    ]
    let allowedPopulations = [
        'owner',
        'words_preview'
    ]

    // query parameter validation
    let errors = []

    // type parameter
    if (allowedTypes.indexOf(query.type) < 0) {
        errors.push({
            parameter: 'type',
            message: 'supplied type not allowed',
            value: query.type
        })
    }

    // size parameter
    if (query.size) {
        let sizeOk = true
        try {
            query.size = parseInt(query.size)
        } catch (e) {
            sizeOk = false
            errors.push({
                parameter: 'size',
                message: 'supplied size not recognized as an integer',
                value: query.size
            })
        }
        
        if (sizeOk && (query.size < 0 || query.size > 100)) { // check that it's in range
            errors.push({
                parameter: 'size',
                message: 'supplied size out of bounds [0, 100]',
                value: query.size
            })
        }
    }

    // start parameter
    if (query.start) {
        let startOk = true
        try {
            query.start = parseInt(query.start)
        } catch (e) {
            startOk = false
            errors.push({
                parameter: 'start',
                message: 'supplied start not recognized as an integer',
                value: query.start
            })
        }

        if ( startOk && (query.start < 0 || query.start > 1000)) { // check value of start
            errors.push({
                parameter: 'start',
                message: 'supplied start out of bounds [0, 1000]',
                value: query.start
            })
        }
    }

    // grades parameter
    if (query.grades) {
        // if it's not an array already, make it one
        if (!Array.isArray(query.grades)) {
            query.grades = [query.grades, query.grades]
        }
        let gradesOk = true

        for(let i = 0; i < query.grades.length; i++) {
            try {
                query.grades[i] = parseInt(query.grades[i])
            } catch (e) {
                gradesOk = false
                errors.push({
                    parameter: 'grades',
                    message: 'supplied grades not a number',
                    value: query.grades[i]
                })
            }

            if (gradesOk && (query.grades[i] < 0 || query.grades[i] > 13)) {
                errors.push({
                    parameter: 'grades',
                    message: 'supplied grades out of bounds [0, 13]',
                    value: query.grades[i]
                })
            }
        }

        if (query.grades.length > 2) {
            errors.push({
                parameter: 'grades',
                message: 'supplied more than two values for grades',
                value: query.grades
            })
        }
    }

    if (query.populate) {
        // if it's a string we'll make it the first element of an array
        if (!Array.isArray(query.populate)) {
            query.populate = [query.populate]
        }

        query.populate.forEach((property) => {
            if (allowedPopulations.indexOf(property) < 0) {
                errors.push({
                    parameter: 'populate',
                    message: 'supplied populate value is not allowed',
                    value: property
                })
            }
        })
    }

    // subjects parameter
    //  make sure subjects is an array
    if (!Array.isArray(query.subjects)) {
        query.subjects = [query.subjects]
    }

    let disallowedSubjects = []
    for (let sub in query.subjects) {
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

    return errors.length > 0 ? errors : false
}

// Get all Readings from users that requesting user follows
router.get("/feed", function(req, res) {
    let user = req.user

    let query = {}

    // query parameter default setting
    query.type = req.query.type || 'following' // default should be changed once a more public-friendly results set is available
    query.size = req.query.size || 15
    query.start = req.query.start || 0
    query.grades = req.query.grades
    query.subjects = req.query.subjects || []
    query.populate = req.query.populate || []

    let errors = validateAndCleanSearchParams(query)
    // stop execution if there are any errors
    if (errors.length > 0) { return res.status(400).send({ errors: errors }) }

    let readingQuery = {
        $and: []
    }

    switch (query.type) { // there will eventually be more here for types
        case 'following':
            let followedUsers
            if (user && user.following && user.following.length > 0) {
                followedUsers = user.following
            } else {
                // they won't have any readings with matching owner_ids if they aren't following anyone
                return res.status(200).send({ readings: [] })
            }

            let typeQuery = {
                public: true,
                $or: []
            }

            let len = followedUsers.length
            for (let i = 0; i < len; i++) {
                typeQuery.$or.push({ "owner_id" : followedUsers[i] })
            }
            readingQuery.$and.push(typeQuery)
            break
        default:
            let error = {
                parameter: 'type',
                message: 'unknown type parameter',
                value: query.type
            }
            console.error(error)
            return res.status(500).send({ errors: [error] })
            break
    }

    // filter down on grade level if it is given
    if (query.grades && query.grades.length > 0) {
        readingQuery.$and.push({ grade_levels: { $gte: Math.min(...query.grades), $lte: Math.max(...query.grades) }})
    }


    // this projection will be sent to Mongo to immediately follow up the query
    let projection = {}
    let fieldsToReturn = [
        'title',
        'owner_id',
        'teacher_ids',
        'public',
        'promoter_ids',
        'source',
        'subjects',
        'grade_levels',
        'cover_img',
        'tags',
        'draft',
        'version_id',
        'createdAt',
        'updatedAt'
    ]
    // first, set up all of the fields that will be returned unaltered
    let len = fieldsToReturn.length
    for(let i = 0; i < len; i++) {
        projection[fieldsToReturn[i]] = true
    }
    // set up the words preview if the endpoint wants words
    query.populate.indexOf('words_preview') > -1 && (projection.words_preview = { $slice: ["$words", 200] })

    Q(
        // Reading.find(
        //     readingQuery,
        //     projection
        // )
        Reading.aggregate([
            { $match: readingQuery },
            { $project: projection },
            { $skip: query.start },
            { $limit: query.size },

        ])
        // .populate('owner_id', 'fullname username')
        // .sort({createdAt: -1})
        .exec()
    ).then((results) => {
        // return res.status(200).send({ readings: results, query: { $match: readingQuery }, proj: projection })
        return res.status(200).send({ readings: results })
    })
    .catch((err) => {
        console.error(err)
        return res.status(500).send()
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
