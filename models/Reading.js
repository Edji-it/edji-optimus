/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator")
var Comment = require("./Comment")
var Tags = require("./Tags")

module.exports = ModelCreator("Reading", {
    html:{type: String, required: true},
    preppedHtml:String, // depricated
    words: {type: [], required: true},
    title:{type: String, required: true},
    owner_id:{type: String, required: true, ref: "User"},
    teacher_ids:[String],
    public:Boolean,
    comments:[Comment.schema],
    promoter_ids: [String],
    source:String,
    cover_img: String,
    tags: [Tags.schema],
    draft: { type: Boolean, default: true }
})