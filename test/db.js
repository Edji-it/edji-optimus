var chai = require("chai");
var chaiHttp = require("chai-http");
var server = require("./../index");
// var should = chai.should();

chai.use(chaiHttp);

var Q = require("q");
// var loginController = require("./../LoginController");

var User = require("./../models/User");

var users = {
  newUser: {
    username:"nennerB",
    fullname:"nennerB nilkciH",
    password:"nennerbPass",
    email:"nennerb.nilkcih@gmail.com",
    isTeacher: false
  },
  existingUser: {
    username: "Ydoc",
    fullname: "Ydoc Repmup",
    password: "whatsup",
    email:"cody@cody.cod",
    isTeacher: true
  },
  existingUserCredentials: {
    user: {
      username: "Ydoc",
      password: "whatsup"
    }
  },
  incorrectCredentials: {
    user: {
      username: "Ydoc",
      password: "whatsups"
    }
  },
  existingUserToken: ""
}

var readings = {
  newReading: {
    title: "Test Reading",
    newReading: {
      title: "Test Reading",
      source: "http://www.source.com",
      words: [{"styles" : [ "p", "p-first"],"str" : "This"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p"],"str" : "is"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p"],"str" : "test"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p", "p-last"],"str" : "content"},{"styles" : [ "br"],"str" : ""}]
    }
  }
}

var loginUser = function(user) {
  return new Promise((resolve, reject) => {
    chai.request(server)
        .post("/users/login")
        .send(db.users.existingUserCredentials)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.body.token);
          }
        });
  });

  var newUser = new User(user);
}

var db = {
  seedDB: (done) => {
  var promises = [
      User.remove({}),
      User(users.existingUser).save((err) => {
        if (err) {
            console.error("Unable to save seed user for testing");
            console.error(err);
        } else {
          loginUser(users.existingUser).then((token) => {
            users.existingUserToken = token;
          });
        }
      })
    ]

    Q.all(promises).done((results) => {
      done();
    });
  },
  users: users,
  readings: readings
}

module.exports = db;
