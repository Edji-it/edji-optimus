/**
 * Institution Model
 */
var ModelCreator = require("./ModelCreator");

var Model =  ModelCreator("Institution", {
    name: { type: String, required: true }, // indicating the institution's full name
    abbreviation: { type: String }, // indicating the institution's preferred abbreviation
    // logo: { type: String }, // perhaps we could have a logo url to display at some point - not now
    license_ids: [{ type: mongoose.Schema.ObjectId }], // license id's which belong to this institution
    parent_institution: { type: mongoose.Schema.ObjectId, required: true }, // id of the overarching institution 
});

module.exports = Model;