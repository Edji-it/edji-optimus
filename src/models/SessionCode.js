ModelCreator = require('./ModelCreator');
mRand = require('mongoose-simple-random');

var codeSchema = {
    code: {
        type: String,
        unique: true,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    }
}

var model = ModelCreator("SessionCode", codeSchema, function(schema) {
    schema.plugin(mRand);
});

module.exports = model;
