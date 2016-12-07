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
    if (req.user && req.user.isTeacher){
        Session.find({teacher_id:user._id}, callback).populate('teacher_id','fullname email username').populate('reading_id','title');
    }
    else{
        console.log("Find and populate");
        Session.find({students_ids:user._id}, callback).populate('teacher_id','fullname email username').populate('reading_id','title');
    }
});
router.get("/:id", function(req, res){
    var id = req.params.id;

    var findParams = {};

    if (mongoose.Types.ObjectId.isValid(id)){
        findParams._id = id;
    }
    else {
        findParams.code = id;
    }

    Session.findOne({_id: id}).populate('teacher_id', null, '<users User>', function(err,result1){
        //result1.id will be your result2 in the question instead of an id
        console.log("Populated Teacher id:");
        console.log(result1);

        result1.id.populate('id.id',null,'<Collection3 Model>',function(err,result){
        //result1.id.id is now your result3 in the question
        });
    });

    Session.find(findParams, function(error, _result){
        error && console.log(error);
        // find returns an array, and we should only be getting one item back
        var result = _result.pop();
        if (result){
            var promises = result.comments.map(function(comment){
                return Q.Promise(function(resolve, reject){
                    User.findOne({_id:comment.user_id}, function(err, user){
                        if (user){
                            comment.user = user;
                        }
                        resolve();
                    });
                });
            });

            Q.all(promises).then(function(){
                res.json(result);
            });
        }
        else{
            res.json({error:"No Result"});
        }

    });
});

router.post("/:id", function(req, res) {
    var session = Session(req.body.session);
    session["reading_id"] = req.params.id;

    if (!session.teacher_id) {
        session.teacher_id = req.user.user_id;
    }

    session.save(function(error, result) {
        if (!error){
            res.send(result);
        }
        if (error){
            res.send(error);
        }
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
    });

});

router.get("/:id/comments", function(req, res){

    var _id = req.params.id;

    Session.findById({_id}, function(err, result){
        res.send(result.comments);
    });

});

router.get("/add/:code", function(req, res) {
    var user = req.user;
    var code = req.params.code;

    // all codes currently in database are lowercase
    Session.find({code:code.toLowerCase()}, function(err, results) {

        if (err) {
            res.json({error:err});
            return;
        }

        if (!results && results.length){
            res.json({error:"No Session Found"});
            return;
        }

        var session = results.pop();

        if (session) {
            console.log(user);
            if (!user.type || !user.type === "temp") {
                session.students_ids.push(req.user._id);
            }
            session.save(function(error, result){
                res.json({success:true, sessionId: result._id});
                return;
            });
        } else {
            res.json({success:false});
            return;
        }

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
