/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express")
var Reading = require("./../models/Reading")
var Project = require("./../models/Project")
var User = require("./../models/User")
var MountModelToRouter = require("./MountModelToRouter")
var Q = require("q")
var router = express.Router()

MountModelToRouter(router, Reading, "reading", { list: false, read: true, delete: true, create:false })

router.post("/", function(req, res) {
    var reading = req.body.reading
    var user = req.user

    if (!user) {
        res.status(401).send()
        return
    }

    if (!reading) {
        res.status(400).send({ validationErrors: { reading: "required" } })
        return
    }

    // owner_id is required on the model, so we set it by default here
    if (!reading['owner_id']) {
        reading['owner_id'] = req.user._id
    }

    // Readings show on a Teacher's dashboard if they exist in the teacher_ids array
    // Even the owner needs to exist in this array (since an owner can later abandon a reading but teachers or students can continue using it)
    if (!reading['teacher_ids']) { reading['teacher_ids'] = [] }
    if (reading.teacher_ids.indexOf(user._id) < 0) { reading.teacher_ids.push(user._id) }

    var model = Reading(reading)

    model.save((error, result) => {
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
            res.status(201).send({ reading: result })
        }
    })
})

router.get("/", function(req, res){
    if (!req.user || !req.user.id) {
        res.status(401).send()
        return
    }

    Reading.find({ 'teacher_ids' : req.user._id },
        'title owner_id teacher_ids public promoter_ids source tags createdAt updatedAt',
        { sort: {createdAt: -1} },
        function(error, results){
            // console.log("Added to readings!!!")
            // console.log(results)
            error && console.error(error)
            results && res.status(200).send({ readings: results })
    })
    
})

router.get("/all/projects", function(req, res) {
    var user = req.user

    if (!user) {
        res.status(401).send()
        return
    }

    var promises = [
        Project.find(
            { $or: [{teacher_id: user._id}, {teacher_ids: user._id}, {students_ids: user._id}, {temp_ids: user._id}] },
            'reading_id teacher_id label code types comments students_ids temp_ids tags updatedAt createdAt'
        ).lean().exec(),
        Reading.find(
            { teacher_ids: req.user._id },
            'title owner_id teacher_ids public promoter_ids source tags createdAt updatedAt',
            { sort: { createdAt: -1 } }
        ).lean().exec()
    ]

    Q.all(promises)
        .then((results) => {
            var projects = results[0]
            var readings = results[1]

            var comLen
            var stuLen
            readings.forEach((reading, index) => {
                readings[index].projects = projects.filter((project) => {
                    if (project.reading_id == reading._id) {
                        if (project.comments) { project.commentCount = project.comments.length }
                        if (project.temp_ids && project.students_ids) { project.studentCount = project.students_ids.length + project.temp_ids.length }

                        project.comments = []
                        project.students_ids = []
                        project.temp_ids = []
                        return true
                    } else { return false }
                })
            })

            res.status(200).send({readings: readings})
        })
        .catch((err) => {
            console.log(err)
            res.status(500).send()
        })
})

//allows teachers to recommend reading to community library
router.put("/:reading_id/recommend", function(req, res) {
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
