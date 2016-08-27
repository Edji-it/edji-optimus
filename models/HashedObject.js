/**
 * Created by bvfergus on 8/27/16.
 */

var ModelCreator = require("./ModelCreator");

var Model =  ModelCreator("HashedObject",{
    hash:{type:String},
    object:{type:Object}
});


module.exports = Model;



