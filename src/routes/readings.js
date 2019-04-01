/**
 * Created by bvfergus on 3/5/16.
 */
const express = require("express")
const mongoose = require("mongoose")
const Q = require("q")
const Sentry = require('@sentry/node')
const joi = require("joi")

let Reading = require("./../models/Reading")
let Project = require("./../models/Project")
let User = require("./../models/User")
let ReadingVersion = require("./../models/ReadingVersion")
let MountModelToRouter = require("./MountModelToRouter")
const authRequired = require('./../middleware/auth-required')
const Referral = require('./../models/Referral')

let router = express.Router()

router.post("/", authRequired, function (req, res, next) {
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
    if (!reading.owner_id || !user._id.equals(reading.owner_id) || !reading.version_id) { reading.version_id = mongoose.Types.ObjectId() }

    // going to just always set owner_id for now. don't see any reason that the front end would set it
    reading.owner_id = user._id

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
            ReadingVersion.findOneAndUpdate(
                { // we can't use save here because of the special $push operation
                    _id: model.version_id,
                    owner_id: user._id
                },
                {
                    $push: { readings: model._id },
                    updatedAt: Date.now()
                }, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true })
                .then((version) => {
                    // This call will always overwrite (avoiding performance issues with findOneAndUpdate)
                    model.save((err, result) => {
                        if (err) {
                            return next(err)
                        }

                        if (user.referred_by && (!user.prefs || !user.prefs.onboarding || !user.prefs.onboarding.firstReadingCreated || !user.prefs.onboarding.firstReadingCreated.firstDone)) {
                            updateUserReferral(user)
                        }
                        return res.status(201).send({ reading: { _id: result._id, version_id: result.version_id, success: true } })

                    })
                })
                .catch((err) => {
                    next(err)
                })
        }
    })
})

/**
 * Updates user and corresponding Referral object to record that the user has completed the referral process!!
 * @param {User} user user attached to req object, must have referred_by
 */
let updateUserReferral = function (user) {
    if (!user.referred_by) { return console.error('no referral code for user') }

    if (!user.prefs) { user.prefs = {} }
    if (!user.prefs.onboarding) { user.prefs.onboarding = {} }

    // update and save the user to record that they've made their first reading
    user.prefs.onboarding.firstReadingCreated = { firstDone: Date.now() }
    user.edjiSave()
        .then(() => {
            // update the corresponding referral so that the referring user gets credit
            Referral.findOneAndUpdate(
                {
                    "code": user.referred_by,
                    "users_referred.user_id": user._id
                },
                {
                    $set: {
                        "users_referred.$.status": "completed"
                    }
                }
            )
        })
        .catch((err) => {
            Sentry.captureException(err)
        })
}

// Update a reading if in draft
router.put("/:reading_id", authRequired, function (req, res, next) {
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
    //  createdAt is in here because we update that property when the reading is published, so that it becomes the time it was shared instead of the time it was drafted
    validProperties = ['html', 'words', 'title', 'public', 'source', 'cover_img', 'tags', 'draft', 'questions', 'subjects', 'grade_levels', 'owner_bookmarked', 'createdAt']
    let invalidProperties = []
    for (let property in reading_upd) {
        if (validProperties.indexOf(property) < 0) {
            invalidProperties.push(property)
        }
    }

    if (invalidProperties.length > 0) {
        return res.status(400).send({ validationErrors: { invalidProperties: invalidProperties } })
    }

    Reading.findById(reading_id)
        .then((result) => {
            if (!result) { return res.status(404).send() }
            if (!user._id.equals(result.owner_id)) { return res.status(401).send() }

            Object.assign(result, reading_upd)
            result.edjiSave()
                .then((result) => {
                    return res.status(200).send({ reading: result })
                })
        })
        .catch((err) => {
            next(err)
        })
})

/**
 * @deprecated 3/31/19
 */
router.delete("/:id", authRequired, function (req, res, next) {
    let id = req.params.id
    let user = req.user

    // Validate the reading ID is of the proper type
    if (!mongoose.Types.ObjectId.isValid(id)) {
        // If the reading id is not a valid mongo id
        return res.status(400).send()
    }

    let promises = []
    // remove all of the readings with the same id
    promises.push(Reading.deleteOne({ _id: id, owner_id: user._id }))
    // remove all projects associated with the reading
    promises.push(Project.deleteMany({ reading_id: id, teacher_id: user._id }))
    // remove the version id from all the version id places
    promises.push(ReadingVersion.updateOne(
        { readings: id, owner_id: user._id },
        { $pull: { readings: id } },
        {}
    ))

    // run all of the promises and return to client
    Q.all(promises)
        .then((responses) => {
            // if the delete reading response indicates that a reading has been deleted, assign properties and return 200
            if (responses.length && responses[0].n > 0) {
                let delReadings = responses[0].n
                let delProjects = responses[1].n

                return res.status(200).send({
                    results: {
                        deletedReadings: delReadings,
                        deletedProjects: delProjects
                    }
                })
            } else {
                return res.status(404).send()
            }

        })
        .catch((err) => {
            next(err)
        })
})

router.get("/versions/:version_id", authRequired, (req, res, next) => {
    let version_id = req.params.version_id
    let user = req.user

    // Validate the reading ID is of the proper type
    if (!mongoose.Types.ObjectId.isValid(version_id)) {
        // If the reading id is not a valid mongo id
        return res.status(400).send()
    }

    let promises = [
        Project.aggregate([
            { $match: { $or: [{ teacher_id: user._id }, { students_ids: user._id }, { temp_ids: user._id }] } },
            {
                $project: {
                    teacher_id: 1, reading_id: 1, label: 1, code: 1, types: 1, createdAt: 1, updatedAt: 1,
                    comment_count: { $size: { $ifNull: ["$comments", []] } },
                    student_count: { $sum: [{ $size: { $ifNull: ["$students_ids", []] } }, { $size: { $ifNull: ["$temp_ids", []] } }] }
                }
            }
        ]),
        ReadingVersion.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(version_id) } },
            { $unwind: "$readings" },
            {
                $project: {
                    _id: "$readings"
                }
            },
            {
                $lookup: {
                    from: "readings",
                    localField: "_id",
                    foreignField: "_id",
                    as: "reading"
                }
            },
            { $unwind: "$reading" },
            {
                $project: {
                    _id: "$reading._id",
                    title: "$reading.title",
                    owner_id: "$reading.owner_id",
                    "public": "$reading.public",
                    source: "$reading.source",
                    cover_img: "$reading.cover_img",
                    draft: "$reading.draft",
                    createdAt: "$reading.createdAt",
                    updatedAt: "$reading.updatedAt",
                    versionCount: 1,
                    version_count: "$versionCount"
                }
            },
            { $sort: { _id: -1 } }
        ])
    ]

    Q.all(promises)
        .then((results) => {
            var projects = results[0]
            var readings = results[1]

            readings.forEach((reading, index) => {
                readings[index].projects = projects.filter((project) => {
                    if (project.reading_id && reading._id.equals(project.reading_id)) { return true }
                    else { return false }
                })
            })
            if (readings.length < 1) { return res.status(404).send() }

            // check the first reading's owner_id to see if it matches the user._id
            if (!user._id.equals(readings[0].owner_id)) { return res.status(401).send() }
            res.status(200).send({ readings })
        })
        .catch((err) => {
            next(err)
        })
})

router.get("/all/projects", authRequired, function (req, res, next) {
    var user = req.user

    let promises = [
        Project.aggregate([
            { $match: { $or: [{ teacher_id: user._id }, { students_ids: user._id }, { temp_ids: user._id }] } },
            {
                $project: {
                    teacher_id: 1, reading_id: 1, label: 1, code: 1, types: 1, createdAt: 1, updatedAt: 1,
                    comment_count: { $size: { $ifNull: ["$comments", []] } },
                    student_count: { $sum: [{ $size: { $ifNull: ["$students_ids", []] } }, { $size: { $ifNull: ["$temp_ids", []] } }] }
                }
            }
        ]),
        ReadingVersion.aggregate([
            { $match: { owner_id: user._id } },
            {
                $project: {
                    versionCount: { $size: "$readings" },
                    readings: 1,
                    updatedAt: 1
                }
            },
            { $unwind: "$readings" },
            {
                $group: {
                    _id: "$_id",
                    reading: { $last: "$readings" },
                    versionCount: { $last: "$versionCount" },
                    updatedAt: { $last: "$updatedAt" },
                    promoter_count: { $last: "$promoter_count" }
                }
            },
            { $sort: { "updatedAt": -1 } },
            {
                $lookup: {
                    from: "readings",
                    localField: "reading",
                    foreignField: "_id",
                    as: "reading"
                }
            },
            { $unwind: "$reading" },
            {
                $project: {
                    _id: "$reading._id",
                    title: "$reading.title",
                    owner_id: "$reading.owner_id",
                    "public": "$reading.public",
                    source: "$reading.source",
                    subjects: "$reading.subjects",
                    grade_levels: "$reading.grade_levels",
                    cover_img: "$reading.cover_img",
                    draft: "$reading.draft",
                    version_id: "$reading.version_id",
                    createdAt: "$reading.createdAt",
                    updatedAt: "$reading.updatedAt",
                    versionCount: 1
                }
            }
        ])
    ]

    Q.all(promises)
        .then((results) => {
            var projects = results[0]
            var readings = results[1]

            readings.forEach((reading, index) => {
                readings[index].projects = projects.filter((project) => {
                    if (project.reading_id && reading._id.equals(project.reading_id)) { return true }
                    else { return false }
                })
            })

            res.status(200).send({ readings })
        })
        .catch((err) => {
            next(err)
        })
})

/**
 * Pass in query parameters and receive an array of errors if there is an error, and false if no errors
 *  it also makes a few changes to clean the data on the query parameters supplied
 * @param {any} query The query parameters from the req object
 */
let validateAndCleanSearchParams = function (query) {
    // allowable parameters
    let allowedTypes = [
        'global',
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

        if (startOk && (query.start < 0 || query.start > 1000)) { // check value of start
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

        for (let i = 0; i < query.grades.length; i++) {
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
router.get("/feed", function (req, res, next) {
    let user = req.user

    // the aggregation pipeline we'll be building throughout this route
    let pipeline = []

    // the query parameters passed in from req.query
    let query = {}

    // query parameter default setting
    query.type = req.query.type || 'global' // default should be changed once a more public-friendly results set is available
    query.size = req.query.size || 15
    query.start = req.query.start || 0
    query.grades = req.query.grades
    query.subjects = req.query.subjects || []
    query.populate = req.query.populate || []

    let errors = validateAndCleanSearchParams(query)
    // stop execution if there are any errors
    if (errors.length > 0) { return res.status(400).send({ errors: errors }) }

    let readingQuery = {
        $and: [
            { draft: { $ne: true } },
            { parent_id: { $exists: false } }
        ]
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
                typeQuery.$or.push({ "owner_id": followedUsers[i] })
            }
            readingQuery.$and.push(typeQuery)
            break
        case 'global':
        default:
            readingQuery.$and.push({ public: true })
            break
    }

    // filter down on grade level if it is given
    if (query.grades && query.grades.length > 0) {
        readingQuery.$and.push({ grade_levels: { $gte: Math.min(...query.grades), $lte: Math.max(...query.grades) } })
    }

    // don't get readings that belong to the requesting user
    user && readingQuery.$and.push({ owner_id: { $ne: user._id } })

    // finished creating readingQuery, it's the first step of the pipeline
    pipeline.push({ $match: readingQuery })

    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'owner_id',
            foreignField: '_id',
            as: 'owner'
        }
    })

    projection = {
        'title': true,
        'owner_id': true,
        'public': true,
        'owner._id': true,
        'owner.fullname': true,
        'owner.username': true,
        'owner.avatar': true,
        'owner.identities': true,
        'promoter_ids': true,
        'source': true,
        'subjects': true,
        'grade_levels': true,
        'cover_img': true,
        'tags': true,
        'draft': true,
        'version_id': true,
        'createdAt': true,
        'updatedAt': true,
        'heroic': { $gt: [{ $size: "$questions" }, 0] } // see if the reading makes use of hero features,
    }

    // if the words_preview is requested, calculate this into the projection
    query.populate.indexOf('words_preview') > -1 && (projection.words_preview = { $slice: ["$words", 200] })

    // finished with initial projection
    pipeline.push({ $project: projection })
    pipeline.push({ $unwind: '$owner' }) // owner will come back as an array, so we'll unwind it
    pipeline.push({ $match: { 'owner.identities': 'teacher' } }) // only return readings with teacher identitiy

    // pagination factors
    pipeline.push(
        { $sort: { updatedAt: -1 } }, // sort by newly updated first - HAS TO BE CALLED BEFORE SKIP AND LIMIT
        { $limit: 1000 }, // this limits the total number returnable to 1000
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                readings: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                total: true,
                readings: { $slice: ["$readings", query.start, query.size] }
            }
        }
    )

    Reading.aggregate(pipeline)
        .then((results) => {
            results = results[0] || { total: 0, readings: [] } // aggregations return arrays, so take the first element
            return res.status(200).send({ total: results.total, readings: results.readings })
        })
        .catch((err) => {
            next(err)
        })
})

MountModelToRouter(router, Reading, "reading", { list: false, read: true, delete: false, create: false })

module.exports = router
