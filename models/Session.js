/**
 * Created by nard on 8/21/16.
 */
var ModelCreator = require("./ModelCreator");
var Comment = require("./Comment");
var SessionCode = require("./SessionCode");
var Hashids = require("hashids");
var mongoose = require("mongoose");
var Model = ModelCreator("Session", {
    reading_id:{type:String, required:true, ref:"Reading"},
    teacher_id:{type:String, ref:"User"},
    comments:[Comment.schema],
    students_ids:[String],
    label:{type:String, required:true},
    code:{type:String, unique:true}
});

var salt = "SALT ME BBZ FRESH SALT";

Model.schema.pre("save", function(next){
    if (!this.code){
        // Model.find({}, (error, results)=>{
            // var length = (results && results.length && results.length > 0 && results.length - 1) || 0;
            // var hashids = new Hashids(salt, 6);
    var this_session = this;

        SessionCode.findOne({active: false}, function(err, result) {
            if (!err) {
                this_session.code = result.code;
                result.active = true;
                result.save(function(err, result) {
                    if (!err) {
                        next();
                    } else {
                        console.error(err);
                    }
                });
            } else {
                console.error(err);
            }
        });
        // });
    } else {
        next();
    }
});
module.exports = Model;
