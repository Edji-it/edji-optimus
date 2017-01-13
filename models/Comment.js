/**
 * Comment Model
 * - Attached to Project objects
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ModelCreator = require("./ModelCreator");
var User = require("./../models/User");

var Model =  ModelCreator("Comment",{
    start: Number,
    end: Number,
    data: String,
    user_id: String,
    user: Object, //{ type: Schema.ObjectId, ref: 'User'},
    author: String,
    text: String,
    type: String
    //TODO:need a better way to include this field. dont think it should be a part of the scheema. Or maybe it should include itself on load/initialization
    // I'm not sure this ever gets stored...
});

module.exports = Model;
