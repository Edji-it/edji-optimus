/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator");
var bcrypt = require("bcrypt");

var model = ModelCreator("User", {
    username:{type:String, unique:true, required:true},
    fullname:{type:String, required:true},
    password:{type:String, required:true},
    email:{type:String, unique:true, required:true},
    isTeacher:Boolean
});

model.schema.pre("save", function(next){

    if (this._id && !this.isModified("password")){
        next();
    }

    bcrypt.hash(this.password, 10, (error, hash)=>{
       this.password = hash;
       console.log(error);
        next();
    });

});

module.exports = model;
