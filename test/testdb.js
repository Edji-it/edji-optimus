var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")
var data = require("./data")

var seedDB = function() {
  return new Promise((resolve, reject) => {

    // set up array of promises to remove data from all used models
    var removeData = [
      User.remove({})
    ]

    // execute removeData promises and create array of promises with which to seed the database
    Q.all(removeData).done((results) => {
      var saveData = [
        User(data.users.existingUser).save((err) => {
          if (err) {
              console.error("Unable to save seed user for testing");
          }
        })
      ]

      // execute all promises that save data
      Q.all(saveData).done((results) => {
        resolve()
      })
    })
  })
}

module.exports = {
  seedDB: seedDB
}