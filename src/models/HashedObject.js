/**
 * Created by bvfergus on 8/27/16.
 */

var ModelCreator = require("./ModelCreator");

var Model =  ModelCreator("HashedObject",{
    hash:{type:String},
    object:{type:Object}
});
var salt = "SALT THIS SHIT";
Model.schema.pre("save",(next)=>{

    if (!this.hash){
        Model.find({}, (error, results)=>{

            var length = (results && results.length && results.length > 0 && results.length - 1) || 0;

            var hashids = new Hashids(salt);
            this.hash = hashids(length);
            next();
        });
    }

});

module.exports = Model;
