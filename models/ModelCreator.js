/**
 * Created by bvfergus on 3/5/16.
 */
var mongoose = require("mongoose");

mongoose.connect('mongodb://edjiuser:edjiuser1@ds023408.mlab.com:23408/edji', {user:"edjiuser", password:"edjiuser1"});
mongoose.connection.on("error", console.error.bind(console, "connection error:"));
mongoose.connection.once("open", function(){
    console.log("connected!");
});

module.exports = function(modelName, schemaJson){

    var Schema = new mongoose.Schema(schemaJson);

    var Model = mongoose.model(modelName, Schema);

    Model.prototype.oldSave = Model.prototype.save;
    Model.prototype.save = function(callback){

        var doOldSave = ()=>{
            this.oldSave(callback);
        };

        if (this._id) {
            console.log("has ID ");
            Model.findById(this._id, (result)=>{
                console.log("in result");

                if (result){
                    console.log("result existrs and its " + result);

                    Model.findOneAndUpdate({_id:this._id},  this, {new:true}, callback);
                }
                else{
                    console.log("doing old savesave");
                    doOldSave();
                }
            })
        }

        else {
            doOldSave();
        }

    };

    return Model;
};
