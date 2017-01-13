/**
 * Project Model
 */
var ModelCreator = require("./ModelCreator");
var Comment = require("./Comment");
var SessionCode = require("./SessionCode");
var Hashids = require("hashids");
var mongoose = require("mongoose");

/** mongoose hook for validation against acceptable values for `types` */
var typesEnum = {
    values: ['emoji', 'text'],
    message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

var Model = ModelCreator("Project", {
    reading_id:{type:String, required:true, ref:"Reading"},
    teacher_id:{type:String, ref:"User"},
    comments:[Comment.schema],
    students_ids:[{ type: String, ref: "User" }],
    temp_ids: [{ type: String, ref: "TempUser" }],
    label:{type:String, required:true},
    code:{type:String, unique:true},
    types: [{ type: String, enum: typesEnum, default: "emoji" }]
});

Model.schema.pre("save", function(next){
    if (!this.code){
        var this_project = this;

        SessionCode.findOne({active: false}, function(err, result) {
            if (!err) {
                this_project.code = result.code;
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
    } else {
        next();
    }
});
module.exports = Model;
