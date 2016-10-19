/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator");
var Comment = require("./Comment");

module.exports = ModelCreator("Reading", {
    html:String,
    preppedHtml:String,
    title:String,
    owner_id:String,
    teacher_ids:[String],
    public:Boolean,
    comments:[Comment.schema],
    promoter_ids: [String]
});