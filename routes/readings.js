/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var Reading = require("./../models/Reading");
var Session = require("./../models/Session");
// var Comment = require("./../models/Comment");
var User = require("./../models/User");
var MountModelToRouter = require("./MountModelToRouter");
var Q = require("q");
var router = express.Router();

MountModelToRouter(router, Reading, "reading", { list: false, read: true, delete: true, create:false });

router.post("/", function(req, res) {
        console.log("New reading posted!");

        if (!req.body['reading']) {
            //send error
            return;
        }
        if (!req.body.reading['owner_id']) {
            req.body.reading['owner_id'] = req.user._id;
        }
        // Readings show on a Teacher's dashboard if they exist in the teacher_ids array
        // Even the owner needs to exist in this array (since an owner can later abandon a reading but teachers or students can continue using it)
        if (!req.body.reading['teacher_ids']) {
            req.body.reading['teacher_ids'] = [];
        }
        req.body.reading['teacher_ids'].push(req.user._id);

        var instanceData = req.body.reading;
        var reading = Reading(instanceData);

        reading.save((error, result)=>{
            console.log(error);
            res.json(result);
        });
});

router.get("/", function(req, res){
    if (!req.user || !req.user.id) {
        res.status(401).send();
        return;
    }

    Reading.find({ 'teacher_ids' : req.user._id }, 'title owner_id teacher_ids public promoter_ids source createdAt updatedAt', function(error, results){
        // console.log("Added to readings!!!");
        // console.log(results);
        error && console.log(error);
        results && res.json(results);
    });
    
});

router.get("/:id/sessions/:user_id", function(req, res){

    Session.find({ "reading_id":req.params.id, "teacher_id":req.params.user_id }, function(error, result){
        error && console.log(error);
        // find returns an array, and we should only be getting one item back
        result && res.json( result );
    });

    // res.send([]);

});

//allows teachers to recommend reading to community library
router.put("/:reading_id/recommend", function(req, res) {
    var reading_id = req.params.reading_id;
    var user = req.user;

    //user must be teacher in order to recommend
    if (!user.isTeacher) {
        res.status(400).send();
        return;
    }

    Reading.findById(reading_id, function(error, reading) {
        error && console.log(error);

        if (reading) {
            // console.log(reading);
            if (!reading.promoter_ids) { //update older readings
                console.log("We had to make it");
                reading.promoter_ids = [];
            } else if (reading.promoter_ids.indexOf(user._id) >= 0) {
                res.status(304).send();
                return;
            }

            reading.promoter_ids.push(user._id);
            console.log(reading.promoter_ids);

            reading.save();
            res.status(204).send();
        }
    });
});

module.exports = router;
