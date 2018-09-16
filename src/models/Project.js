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
    reading_id:{ type: mongoose.Schema.ObjectId, ref: "Reading" },
    teacher_id:{ type: mongoose.Schema.ObjectId, required:true, ref:"User" },
    comments:[Comment.schema],
    answers:[Comment.schema],
    students_ids:[{ type: mongoose.Schema.ObjectId, ref: "User" }],
    temp_ids: [{ type: mongoose.Schema.ObjectId, ref: "TempUser" }],
    label:{type:String, required:true},
    code:{type:String, unique:true},
    types: [{ type: String, enum: typesEnum, default: "emoji" }],
    tags: [Tags.schema],
    heat_vision: Boolean,
    report_evals: [{
        user_id: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
        evaluation: { type: String, required: true },
        createdAt: { type: Date, required: true, default: Date.now() }
    }],
    group_instructions: String 
}, (schema) => {
    // grab a session code and add it to the project before saving
    schema.pre("edjiSave", function(next){
        if (this.code) { next() }
        else {
            SessionCode.findOne({ active: false })
            .then((result) => {
                this.code = result.code
                result.active = true
                result.edjiSave(false, (err, result) => {
                    if (!err) {
                        next()
                    } else {
                        console.error(err)
                        next(err)
                    }
                })
            })
            .catch((err) => {
                console.error(err)
                next(err)
            })
        }
    })

    // add population of user object
    schema.virtual('teacher', {
        ref: 'User',
        localField: 'teacher_id',
        foreignField: '_id',
        justOne: true
    })

    // add population of reading object
    schema.virtual('reading', {
        ref: 'Reading',
        localField: 'reading_id',
        foreignField: '_id',
        justOne: true
    })
})

module.exports = Model
