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

MountModelToRouter(router, Reading, "reading", { list: false, read: true, delete: true, create:false })

router.post("/", Middleware.authRequired, function(req, res) {
    var reading = req.body.reading
    var user = req.user

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
                            res.status(500).send(error)
                            return
                            
                        } else {
                            res.status(201).send({ reading: { _id: result._id, success: true } })
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
    validProperties = ["html", "words", "title", "public", "source", "cover_img", "tags", "draft"]
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
            result.save((err) => {
                console.log("got saved result")
                if (err) {
                    console.error(err)
                    return res.status(500).send()
                } else {
                    return res.status(200).send({ reading: result })
                }
            })
        })
        .catch((err) => {
            console.log("error caught while looking up the reading")
            console.error(err)
            return res.status(500).send()
        })

    // var reading = Reading(reading_upd)

    // reading.save().then(
    //     reading => {
    //         if (!reading) {
    //             res.status(404).send()
    //             return
    //         } else {
    //             reading.success = true;
    //             res.status(201).send({reading: reading})
    //         }
    //     }
    // ).catch(
    //         error => {
    //         console.error(error)
    //         res.status(500).send()
    //     }
    // )
})

// // Used for deleting readings in Postman for now
// router.delete("/:id", Middleware.authRequired, function(req, res) {
//     var id = req.params.id
//     var user = req.user

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         res.status(400).send()
//         return
//     }

//     Reading.remove({_id: id}, (error, obj) => {
//         if (error) {
//             console.error(error)
//             res.status(500).send()
//             return
//         } else if (obj.result.n === 0) {
//             res.status(404).send()
//             return
//         } else {
//             res.status(204).send()
//             return
//         }
//     })
// })

router.get("/", Middleware.authRequired, function(req, res){

    Reading.find({ teacher_ids : req.user._id },
        'title owner_id teacher_ids public promoter_ids source tags createdAt updatedAt draft',
        { sort: {createdAt: -1} },
        function(error, results){
            // console.log("Added to readings!!!")
            // console.log(results)
            if (error) {
                console.error(error)
                res.status(500).send()
                return
            } else {
                res.status(200).send({ readings: results })
            }
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
        Reading.aggregate([
            { $match: { teacher_ids: user._id.toString() }},
            { $project: {
                title: 1, owner_id: 1, teacher_ids: 1, "public": 1, source: 1, cover_img: 1, draft: 1, createdAt: 1, updatedAt: 1,
                promoter_count: { $size: { $ifNull: [ "$promoter_ids", [] ]}}
            }},
            { $sort: { createdAt: -1 }}
        ]).exec()
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
            console.log(err)
            res.status(500).send()
        })
})

//allows teachers to recommend reading to community library
router.put("/:reading_id/recommend", Middleware.authRequired, function(req, res) {
    var reading_id = req.params.reading_id
    var user = req.user

    Reading.findById(reading_id, function(error, reading) {
        error && console.log(error)

        if (reading) {
            if (!reading.promoter_ids) { //update older readings
                reading.promoter_ids = []
            } else if (reading.promoter_ids.indexOf(user._id) >= 0) {
                res.status(304).send()
                return
            }

            reading.promoter_ids.push(user._id)

            reading.save()
            res.status(204).send()
        }
    })
})

module.exports = router
