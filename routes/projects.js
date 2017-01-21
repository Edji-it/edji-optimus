/**
 * corbfon 1/12/17
 */
var express = require( "express");
var mongoose = require( "mongoose");
var Project = require("./../models/Project");
var Comment = require("./../models/Comment");
var User = require("./../models/User");
var MountModelToRouter = require("./MountModelToRouter");
var Q = require("q");
var router = express.Router();

MountModelToRouter(router, Project, "project", {read:false, list:false, delete:false});

router.get("/",function(req, res){

    var user = req.user;
    if (!req.user) {
        res.status(401).send({ validationErrors: { user: "required" } });
        return;
    }

    var findParams = {};

    if (user.isTeacher) {
        findParams.teacher_id = user._id;
    } else if (user.type && user.type === "temp") {
        findParams.temp_ids = user._id;
    } else {
        findParams.students_ids = user._id;
    }

    Project.find(
        findParams,
        'reading_id teacher_id label code types updatedAt createdAt',
        { sort: { createdAt: -1 } }, 
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send();
                return;
            }

            res.status(200).send(result);
        }
    )
    .populate('teacher_id','fullname email username')
    .populate('reading_id','title');
});

router.post("/", function(req, res) {
    var project = req.body.project

    if (!req.user) {
        res.status(401).send()
        return
    }
    if (!project) {
        res.status(400).send({ validationErrors: { project: "required" } })
        return
    }

    // if a specific id isn't passed, go ahead and set it as the creating user's id
    if (!project.teacher_id) {
        project.teacher_id = req.user._id
    }

    var model = Project(project)

    model.save(function(error, result) {
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
    var id = req.params.id
    var user = req.user

    if (!user) {
        res.status(401).send()
        return
    }

    var findParams = {}

    //creates flexibility to use with either project code or with project id
    if (mongoose.Types.ObjectId.isValid(id)) {
        findParams._id = id
    } else {
        findParams.code = id.toLowerCase()
    }

    // Only pull out arrays since we'll be populating the object after saving
    Q(Project.find(findParams).exec())
        .then((projects) => {
            var project = projects.pop()

            if (!project) {
                res.status(404).send()
                return
            }

            // don't add the teacher to the students array of their own project
            if (user._id != project.teacher_id) {
                if (user.type && user.type === "temp") {
                    // some old readings don't have temp_ids
                    if (!project.temp_ids) {
                        project.temp_ids = []
                    }
                    // only add the user's id if it's not already in the project
                    if (project.temp_ids.indexOf(req.user._id) < 0) {
                        project.temp_ids.push(req.user._id)
                    }
                } else {
                    // only add the user's id if it's not already in the project
                    if (project.students_ids.indexOf(req.user._id) < 0) {
                        project.students_ids.push(req.user._id)
                    }
                }
            }

            project.save((err) => {
                if (err) {
                    throw new Error(err)
                }

                project.populate('students_ids', 'fullname')
                    .populate('temp_ids', 'fullname', (err, result) => {
                        if (err) {
                            throw new Error(err)
                        }

                        res.status(200).send({ project: result })
                        return
                    })
            })
        })
        .catch((error) => {
            console.error(error)
            res.status(500).send()
        })
})

// currently only works for teacher deleting a project
router.delete("/:id", function(req, res) {
    var id = req.params.id
    var user = req.user

    if (!user) {
        res.status(401).send()
        return
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).send()
        return
    }

    Project.remove({_id:req.params.id, teacher_id: user._id}, (error, obj) => {
        if (error) {
            console.error(error)
            res.status(500).send()
            return
        } else if (obj.result.n === 0) {
            res.status(404).send()
            return
        } else {
            res.status(204).send()
            return
        }
    })
})

// get projects for a single reading id
router.get("/reading/:reading_id", function(req, res){
    var reading_id = req.params.reading_id
    var user = req.user

    if (!user) {
        res.status(401).send()
        return
    }

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
                console.log(error)
                res.status(500).send()
            } else {
                res.status(200).send({ projects: projects })
            }
        }
    )
})

router.post("/:id/comments", function(req, res) {
    var _id = req.params.id
    var user = req.user

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        res.status(400).send()
        return
    }

    if (!user) {
        res.status(401).send()
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
                Object.assign(currentComment, comment)
                successStatus = 200
            }
            else{
                project.comments.push(comment)
                successStatus = 201
            }

            project.save(function(error, project){
                if (error) {
                    // constructs object with list of model-defined errors to send to user
                    if (error.name === "ValidationError") {
                        var errors = {};

                        for (var property in error.errors) {
                            if (error.errors[property].kind === "user defined") {
                                errors[property] = error.errors[property].properties.kind;
                            } else {
                                errors[property] = error.errors[property].kind;
                            }
                        }

                        res.status(406).send({ validationErrors: errors });
                        return;
                    } else {
                        res.status(500).send(error);
                        return;
                    }
                } else { res.status(successStatus).send({ comment: project.comments.id(comment._id) }) }
                    
            })
        }
        
    })
})

router.delete("/:project_id/comments/:comment_id", function(req, res){
    var user = req.user
    var project_id = req.params.project_id
    var comment_id = req.params.comment_id

    if (!user) {
        res.status(401).send()
        return
    }
    if (!mongoose.Types.ObjectId.isValid(project_id)) {
        res.status(400).send({ badRequest: { projectId: "invalid" }})
        return
    } else if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        res.status(400).send({ badRequest: { commentId: "invalid" }})
        return
    }

    Project.findByIdAndUpdate(
        {_id :project_id},
        {
            $pull:{
                comments:{
                    _id: comment_id,
                    user_id: user._id
                }
            }
        },{
            passRawResult: true
        }, function(error, result, original){

            if (error){
                console.error(error)
                res.status(500).send()
            } else if (!result) {
                res.status(404).send()
            } else {
                res.status(204).send()
            }
        }
    )
})

router.get("/:project_code/validate", function(req, res) {
    var project_code = req.params.project_code.toLowerCase()

    Q(Project.findOne({code:project_code}).exec()).then(function(project) {
        if (project) {
            res.status(200).send({ _id : project._id })
        } else {
            res.status(404).send()
        }
    })
    .catch(function(err) {
        console.log(err)
        res.status(500).send()
    })
})

module.exports = router
