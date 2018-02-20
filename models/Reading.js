/**
 * Created by bvfergus on 3/5/16.
 */
const mongoose = require("mongoose")
let ModelCreator = require("./ModelCreator")
let Comment = require("./Comment")
let Question = require("./Question")
let Tags = require("./Tags")

module.exports = ModelCreator("Reading", {
    html:{type: String, required: true},
    words: {type: [], required: true},
    title:{type: String, required: true},
    parent_id: { type: mongoose.Schema.ObjectId, ref: "Reading" },
    owner_id: { type: mongoose.Schema.ObjectId, required: true, ref: "User" },
    teacher_ids: [String],
    public: Boolean,
    questions: [Question.schema],
    promoter_ids: [String],
    source: String,
    cover_img: String,
    tags: [Tags.schema],
    draft: { type: Boolean },
    grade_levels: [Number],
    subjects: [String],
    version_id: { type: mongoose.Schema.ObjectId, ref: "ReadingVersion", required: true }
}, (schema) => {
    schema.virtual('owner', {
        ref: 'User',
        localField: 'owner_id',
        foreignField: '_id',
        justOne: true
    })
})