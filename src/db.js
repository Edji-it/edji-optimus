const mongoose = require("mongoose")

const connect = function (mongooseInstance) {
    //sets up database connection based on current NODE_ENV
    console.log('wiring up the database for ' + process.env.NODE_ENV)
    mongooseInstance.connect(process.env.MONGO_HOST, {
        socketTimeoutMS: 120000,
        connectionTimeout: 120000
    })

    console.log('connected with ' + process.env.MONGO_HOST)

    mongooseInstance.connection.on("error", console.error.bind(console, "connection error:"))
    mongooseInstance.connection.once("open", function () {
        console.log("Connected to Mongo!")
    })
}

const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$')
const isValidId = function (id) {
    return id.length === 24 && checkForHexRegExp.test(id)
}

mongoose.validateEdjiId = isValidId

connect(mongoose)

module.exports = mongoose