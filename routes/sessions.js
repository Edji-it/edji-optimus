/**
 * Created by nard on 8/21/16.
 */
/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var mongoose = require( "mongoose");
var Session = require("./../models/Session");
var Comment = require("./../models/Comment");
var User = require("./../models/User");
var MountModelToRouter = require("./MountModelToRouter");
var Q = require("q");
var router = express.Router();

MountModelToRouter(router, Session, "session", {read:false, list:false});

router.get("/",function(req, res){

    var callback = (error, results)=>{
        if (error){
            res.json({error: error});
            return;
        }

        res.json(results);
    };

    var user = req.user;
    if (!req.user) {
        res.status(401).send();
        return;
    }
    
    if (req.user && req.user.isTeacher){
        Session.find({teacher_id:user._id},
            'reading_id teacher_id label code updatedAt createdAt',
            { sort: { createdAt: -1 } },
            callback)
            .populate('teacher_id','fullname email username').populate('reading_id','title');
    }
    else{
        Session.find({students_ids:user._id},
            'reading_id teacher_id label code updatedAt createdAt',
            { sort: { createdAt: -1 } },
            callback)
            .populate('teacher_id','fullname email username').populate('reading_id','title');
    }
});

router.post("/:id", function(req, res) {
    var session = Session(req.body.session);
    session["reading_id"] = req.params.id;

    if (!session.teacher_id) {
        session.teacher_id = req.user.user_id;
    }

    session.save(function(error, result) {
        if (!error){
            res.status(200).send(result);
        }
        if (error){
            res.status(500).send(error);
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

    //creates flexibility to use with either project code or with session id
    if (mongoose.Types.ObjectId.isValid(id)) {
        findParams._id = id;
    } else {
        findParams.code = id;
    }

    // Only pull out arrays since we'll be populating the object after saving
    Q(Session.find(findParams).exec())
        .then((sessions) => {
            if (!sessions) {
                res.status(404).send();
                return;
            }
            var session = sessions.pop();

            if (user.type && user.type === "temp") {
                // some old readings don't have temp_ids
                if (!session.temp_ids) {
                    session.temp_ids = [];
                }
                // only add the user's id if it's not already in the project
                if (session.temp_ids.indexOf(req.user._id) < 0) {
                    session.temp_ids.push(req.user._id);
                }
            } else {
                // only add the user's id if it's not already in the project
                if (session.students_ids.indexOf(req.user._id) < 0) {
                    session.students_ids.push(req.user._id);
                }
            }

            session.save((err) => {
                if (err) {
                    throw new Error(err);
                }

                session.populate('students_ids', 'fullname')
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

router.post("/:id/comments", function(req, res){

    var _id = req.params.id;
    var comment = Comment(req.body.comment);

    if (!comment.user_id) {
        comment.user_id = req.user.user_id;
    }

    //comment.user_id = req.logged_in_user.user_id;
    Session.findById({_id}, function(err, result){
        if (result) {
            var currentComment = result.comments.id(comment._id);

            if (currentComment){
                Object.assign(currentComment, comment);
            }
            else{
                result.comments.push(comment);
            }

            result.save(function(error, result){
                if (!error){
                    res.send(result.comments.id(comment._id));
                }
                //res.send(result);
            });
        } else {
            console.log(err);
            res.status(500).send();
        }
        
    });

});

router.get("/:id/comments", function(req, res){

    var _id = req.params.id;

    Session.findById({_id}, function(err, result){
        res.status(200).send(result.comments);
    });

});

router.delete("/:session_id/comments/:comment_id", function(req, res){

    Session.findByIdAndUpdate(
        {"_id":req.params.session_id},
        {$pull:{
            comments:{
                _id: req.params.comment_id
            }
        }}, function(error, result){
            if (error){
                console.log(error);
            }
            res.json({success:true});

        });

});

router.get("/:session_code/validate", function(req, res) {
    var session_code = req.params.session_code.toLowerCase();

    Q(Session.findOne({"code":session_code}).exec()).then(function(session) {
        if (session) {
            res.status(204).send();
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
