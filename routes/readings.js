/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var Reading = require("./../models/Reading");
var Comment = require("./../models/Comment");
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
        })
    });

});

module.exports = router;