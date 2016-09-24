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
        Session.find({teacher_id:user._id}, callback);
    }
    else{
        Session.find({students_ids:user._id}, callback);
    }
});
router.get("/:id", function(req, res){
    var id = req.params.id;

    var findParams = {};

    if (mongoose.Types.ObjectId.isValid(id)){
        findParams._id = id;
    }
    else{
        findParams.code = id;
    }
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

router.get("/add/:code", function(req, res){

    var code = req.params.code;

    // all codes currently in database are lowercase
    Session.find({code:code.toLowerCase()}, function(err, results){

        if (err){
            res.json({error:err});
            return;
        }

        if (!results && results.length){
            res.json({error:"No Session Found"});
            return;
        }

        var session = results.pop();

        if (session) {
            session.students_ids.push(req.user._id);
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
router.delete("/:reading_id/comments/:comment_id", function(req, res){

    Session.findByIdAndUpdate(
        {"_id":req.params.reading_id},
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

module.exports = router;
