var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")
// var should = chai.should()

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")

var users = {
  newUser: {
    username: "kodiak",
    fullname: "cody",
    password: "codycodycody",
    email: "cody@cody.cod",
    isTeacher: true
  },
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
  testTeacher: {
    username:"will",
    fullname:"William Wallace Steward IV",
    password:"willPass",
    email:"will@will.com",
    isTeacher: true
  },
  testTeacherCreds: {
    user: {
      username:"will",
      password:"willPass"
    }
  },
  testUserCapitalCreds: {
    user: {
      username: "NENNERB",
      password: "nennerbPass"
    }
  },
  incorrectCredentials: {
    user: {
      username: "Ydoc",
      password: "whatsups"
    }
  },
  badUser: {
    username: "shit",
    fullname: "shit",
    email: "wrong@wrong",
    password: "whatever"
  }
}

var readings = {
  newReading: {
    title: "Test Reading",
    html: "This is test content",
    words: [{"styles" : [ "p", "p-first"],"str" : "This"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p"],"str" : "is"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p"],"str" : "test"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p", "p-last"],"str" : "content"},{"styles" : [ "br"],"str" : ""}]
  }
}

var projects = {
  getNewProject: function(readingId) {
    return {
      reading_id: readingId,
      label: "50 shades of Edji",
      types: ["emoji", "text"]
    }
  },
  getInvalidTypesProject: function(readingId) {
    return {
      reading_id: readingId,
      label: "50 shades of Edji",
      types: ["something", "nothing"]
    }
  }
}

module.exports = {
  users: users,
  readings: readings,
  projects: projects
}
