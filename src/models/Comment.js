/**
 * Comment Model
 * - Attached to Project objects
 */
const mongoose = require('mongoose')
const ModelCreator = require('./ModelCreator')

const Model = ModelCreator("Comment", {
    user_id: { type: String, required: true }, // could be any type of user, maybe we want to add a user_type field?
    start: { type: Number, required: true, default: -1 },
    end: { type: Number, required: true, default: -1 },
    data: String,
    dataArray: Array,
    url: { type: String },
    author: String, // user's name, stored for easy access
    text: String, // the text which the comment is on!
    type: String, // type of comment (should be required)
    loc: {
        x: Number,
        y: Number
    },
    reply_to: { type: mongoose.Schema.ObjectId, ref: "Comment" },
    replies: Array,
    questionId: String
}, (schema) => {
    // schema.path('url').set(function (val) {
    //     console.log('setting url as', val)
    //     this._oldUrl = this.url
    //     return val
    // })
})

module.exports = Model
