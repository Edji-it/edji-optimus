/**
 * Created by bvfergus on 3/5/16.
 */

var ModelCreator = require("./ModelCreator");

var Model =  ModelCreator("Comment",{
    start:Number,
    end:Number,
    data:String,
    user_id:String,
    user:Object
    //TODO:need a better way to include this field. dont think it should be a part of the scheema. Or maybe it should include itself on load/initialization
    // I'm not sure this ever gets stored...
});

module.exports = Model;
