/**
 * Created by bvfergus on 3/5/16.
 */

var ModelCreator = require("./ModelCreator");

module.exports = ModelCreator("Comment",{
    start:Number,
    end:Number,
    data:String,
    user_id:String
});
