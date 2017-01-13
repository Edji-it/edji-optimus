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

MountModelToRouter(router, Project, "project", {read:false, list:false});

router.get("/",function(req, res){

    var user = req.user;
    if (!req.user) {
        res.status(401).send();
        return;
    }

    var findParams = {};

    if (user.isTeacher) {
        findParams.teacher_id = user._id;
    } else {
        findParams.students_ids = user._id;
    }

    Project.find(findParams,
        'reading_id teacher_id label code updatedAt createdAt',
        { sort: { createdAt: -1 } }, 
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send();
                return;
            }

            res.status(200).send(result);
        }
    );
});

router.post("/:id", function(req, res) {
    var project = Project(req.body.project);
    project["reading_id"] = req.params.id;

    // if a specific id isn't passed, go ahead and set it as the creating user's id
    if (!project.teacher_id) {
        project.teacher_id = req.user.user_id;
    }

    project.save(function(error, result) {
        if (error) {
            console.error(error);
            res.status(500).send();
        } else {
            res.status(201).send({ project: result });
        }
    });
});

router.get("/:id", function(req, res) {
    var id = req.params.id;
    var user = req.user;

    if (!user) {
        res.status(401).send();
        return;
    }

    var findParams = {};

    //creates flexibility to use with either project code or with project id
    if (mongoose.Types.ObjectId.isValid(id)) {
        findParams._id = id;
    } else {
        findParams.code = id.toLowerCase();
    }

    // Only pull out arrays since we'll be populating the object after saving
    Q(Project.find(findParams).exec())
        .then((projects) => {
            if (!projects) {
                res.status(404).send();
                return;
            }
            var project = projects.pop();

            if (!project) {
                res.status(404).send();
                return;
            }

            if (user.type && user.type === "temp") {
                // some old readings don't have temp_ids
                if (!project.temp_ids) {
                    project.temp_ids = [];
                }
                // only add the user's id if it's not already in the project
                if (project.temp_ids.indexOf(req.user._id) < 0) {
                    project.temp_ids.push(req.user._id);
                }
            } else {
                // only add the user's id if it's not already in the project
                if (project.students_ids.indexOf(req.user._id) < 0) {
                    project.students_ids.push(req.user._id);
                }
            }

            project.save((err) => {
                if (err) {
                    throw new Error(err);
                }

                project.populate('students_ids', 'fullname')
                    .populate('temp_ids', 'fullname', (err, result) => {
                        if (err) {
                            throw new Error(err);
                        }

                        res.json(result);
                        return;
                    });
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send();
        });
});

router.post("/:id/comments", function(req, res) {

    var _id = req.params.id;
    var comment = Comment(req.body.comment);

    if (!comment.user_id) {
        comment.user_id = req.user.user_id;
    }

    //comment.user_id = req.logged_in_user.user_id;
    Project.findById({_id}, function(err, project){
        if (project) {
            var currentComment = project.comments.id(comment._id);

            if (currentComment){
                Object.assign(currentComment, comment);
            }
            else{
                project.comments.push(comment);
            }

            project.save(function(error, project){
                if (!error){
                    res.send(project.comments.id(comment._id));
                }
                //res.send(project);
            });
        } else {
            console.log(err);
            res.status(500).send();
        }
        
    });

});

router.get("/:id/comments", function(req, res){

    var _id = req.params.id;

    Project.findById({_id}, function(err, result){
        res.status(200).send(result.comments);
    });

});

router.delete("/:project_id/comments/:comment_id", function(req, res){

    Project.findByIdAndUpdate(
        {"_id":req.params.project_id},
        {$pull:{
            comments:{
                _id: req.params.comment_id
            }
        }}, function(error, result){
            if (error){
                console.log(error);
                res.status(500).send();
            } else {
                res.status(204).send();
            }
        });

});

router.get("/:project_code/validate", function(req, res) {
    var project_code = req.params.project_code.toLowerCase();

    Q(Project.findOne({"code":project_code}).exec()).then(function(project) {
        if (project) {
            res.status(200).send({ '_id' : project._id });
        } else {
            res.status(404).send();
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send();
    });
});

module.exports = router;
