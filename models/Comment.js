/**
 * Comment Model
 * - Attached to Project objects
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ModelCreator = require("./ModelCreator");
var User = require("./../models/User");

var Model =  ModelCreator("Comment",{
    user_id: {type: String, required: true}, // could be any type of user, maybe we want to add a user_type field?
    start: {type: Number, required: true, default: -1 },
    end: {type: Number, required: true, default: -1 },
    data: String,
    dataArray: Array,
    url: String,
    author: String, // user's name, stored for easy access
    text: String, // the text which the comment is on!
    type: String, // type of comment (should be required)
    loc: { 
        x: Number,
        y: Number
    }
});

module.exports = Model;
