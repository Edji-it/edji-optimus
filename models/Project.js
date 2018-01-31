/**
 * Project Model
 */
var ModelCreator = require("./ModelCreator")
var Comment = require("./Comment")
var SessionCode = require("./SessionCode")
var Hashids = require("hashids")
var mongoose = require("mongoose")
var Tags = require("./Tags")

/** mongoose hook for validation against acceptable values for `types` */
var typesEnum = {
    values: ['emoji', 'text', 'audio', 'reply'],
    message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

var Model = ModelCreator("Project", {
    reading_id:{type: String, required:true, ref:"Reading"},
    teacher_id:{type: String, required:true, ref:"User"},
    comments:[Comment.schema],
    answers:[Comment.schema],
    students_ids:[{ type: String, ref: "User" }],
    temp_ids: [{ type: String, ref: "TempUser" }],
    label:{type:String, required:true},
    code:{type:String, unique:true},
    types: [{ type: String, enum: typesEnum, default: "emoji" }],
    tags: [Tags.schema],
    heat_vision: Boolean
}, (schema) => {
    schema.virtual('teacher', {
        ref: 'User',
        localField: 'teacher_id',
        foreignField: '_id',
        justOne: true
    })
})

Model.schema.pre("save", function(next){
    if (!this.code){
        var this_project = this

        SessionCode.findOne({active: false}, function(err, result) {
            if (!err) {
                this_project.code = result.code
                result.active = true
                result.save(false, function(err, result) {
                    if (!err) {
                        next()
                    } else {
                        console.error(err)
                    }
                })
            } else {
                console.error(err)
            }
        })
    } else {
        next()
    }
})
module.exports = Model
