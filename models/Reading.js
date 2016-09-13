/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator");
var Comment = require("./Comment");

module.exports = ModelCreator("Reading", {
    html:String,
    title:String,
    comments:[Comment.schema]
});