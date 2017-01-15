var chai = require("chai");
var chaiHttp = require("chai-http");
var server = require("./../index");
// var should = chai.should();

chai.use(chaiHttp);

var Q = require("q");

var User = require("./../models/User");

var users = {
  testUser: {
    username:"nennerB",
    fullname:"nennerB nilkciH",
    password:"nennerbPass",
    email:"nennerb.nilkcih@gmail.com",
    isTeacher: false
  },
  testUserCreds: {
    user: {
      username: "nennerB",
      password: "nennerbPass"
    }
  },
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
  }
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

var db = {
  users: users,
  readings: readings
}

module.exports = db;
