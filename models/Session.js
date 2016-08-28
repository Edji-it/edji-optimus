/**
 * Created by nard on 8/21/16.
 */
var ModelCreator = require("./ModelCreator");
var Comment = require("./Comment");
var Hashids = require("hashids");
var mongoose = require("mongoose");
var Model = ModelCreator("Session", {
    reading_id:{type:String, required:true},
    teacher_id:{type:String
                        //,required:true
                },
    comments:[Comment.schema],
    students_ids:[String],
    label:{type:String, required:true},
    code:{type:String, unique:true}
});

var salt = "SALT ME BABY";

Model.schema.pre("save", function(next){

    if (!this.code){
        Model.find({}, (error, results)=>{

            var length = (results && results.length && results.length > 0 && results.length - 1) || 0;

            var hashids = new Hashids(salt, 6);
            this.code = hashids.encode(length);
            next();
        });
    }
    next();
});
module.exports  = Model;