/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var Reading = require("./../models/Reading");
var Session = require("./../models/Session");
var Comment = require("./../models/Comment");
var User = require("./../models/User");
var MountModelToRouter = require("./MountModelToRouter");
var Q = require("q");
var router = express.Router();

MountModelToRouter(router, Reading, "reading");


router.post("/:id/comments", function(req, res){

    var _id = req.params.id;
    var comment = Comment(req.body.comment);

    if (!comment.user_id){
        comment.user_id = req.user.user_id;
    }

    //comment.user_id = req.logged_in_user.user_id;
    Reading.findById({_id}, function(err, result){
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

router.get("/:id/sessions", function(req, res){

    Session.find({"reading_id":req.params.id}, function(error, result){
        error && console.log(error);
        // find returns an array, and we should only be getting one item back
        result && res.json( result );
    });

    // res.send([]);

});


router.post("/:id/sessions", function(req, res){

    var session = Session(req.body.session);
    session["reading_id"] = req.params.id;

    if (!session.teacher_id) {
        session.teacher_id = req.user.user_id;
    }

    // Session.findById({_id}, function(err, result){
    //     var currentComment = result.comments.id(comment._id);

    //     if (currentComment){
    //         Object.assign(currentComment, comment);
    //     }
    //     else{
    //         result.comments.push(comment);
    //     }

        session.save(function(error, result){
            if (!error){
                res.send(result);
            }
            if (error){
                res.send(error);
            }
            //res.send(result);
        });
    // });

});


router.delete("/:reading_id/comments/:comment_id", function(req, res){

    Reading.findByIdAndUpdate(
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
