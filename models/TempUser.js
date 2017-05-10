/**
 * Temporary User Model
 */
var ModelCreator = require("./ModelCreator");
var Filter = require("bad-words"),
    filter = new Filter();

//the same code exists in the User object
var nameRe = /(?:([^a-zA-Z0-9\s]))/g;
var validateName = function(name) {
    return !nameRe.test(name) && filter.clean(name) === name;
};

var model = ModelCreator("TempUser", {
    fullname: {type: String, required: true, validate: [validateName, "Invalid username"]},
    type: {type: String, required: true, default: "temp"},
    prefs: {
        recentEmoji: [ String ],
        onboarding: {
            highlighting: {
                firstDone: Date,
                lastDone: Date
            }
        }
    }
}, function(schema) {
    schema.methods.toPublic = function() {
        return this._doc;
    }
});

module.exports = model;