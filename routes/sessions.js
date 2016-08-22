/**
 * Created by nard on 8/21/16.
 */
/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var Session = require("./../models/Session");
var Comment = require("./../models/Comment");
var User = require("./../models/User");
var MountModelToRouter = require("./MountModelToRouter");
var Q = require("q");
var router = express.Router();

MountModelToRouter(router, Session, "session", {read:false});

router.get("/:id", function(req, res){
    Session.find({"_id":req.params.id}, function(error, _result){
        error && console.log(error);
        // find returns an array, and we should only be getting one item back
        var result = _result.pop();
        if (result){
            var promises = result.comments.map(function(comment){
                return Q.Promise(function(resolve, reject){
                    User.findOne({_id:comment.user_id}, function(err, user){
                        if (user){
                            comment.user = user;
                            resolve();
                        }
                    });
                })
            });

            Q.all(promises).then(function(){
                res.json(result);
            })
        }

    })
});
router.post("/:id/comments", function(req, res){

    var _id = req.params.id;
    var comment = Comment(req.body.comment);

    if (!comment.user_id){
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
        })
    });

});

router.get("/:id/comments", function(req, res){

    var _id = req.params.id;

    Session.findById({_id}, function(err, result){
        res.send(result.comments);
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

        })

});

module.exports = router;