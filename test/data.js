var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")
// var should = chai.should()

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")

var users = {
  newUser:{
    username: Date.now().toString(),
    fullname: "newApiTestUser",
    password: "codycodycody",
    email: "cody@cody.cod",
    isTeacher: true
  },
  duplicateUser: {
    username: "optimusprime",
    password: "optimusprime",
    fullname: "Optimus Prime",
    email: "Optimus@prime.ed",
    isTeacher: true
  },
  testUserCreds: {
    user: {
      username: "optimusprime",
      password: "optimusprime"
    }
  },
  testUserCapitalCreds: {
    user: {
      username: "OPTIMUSPRIME",
      password: "optimusprime"
    }
  },
  incorrectCredentials: {
    user: {
      username: "optimusprime",
      password: "notOPTIMUSpassword"
    }
  },
  badUser: {
    username: "shit",
    fullname: "shit",
    email: "wrong@wrong",
    password: "whatever"
  },
  tempUser: {
    fullname: "corbin"
  },
  testTeacherCreds: {
    user: {
      username: "apiteacher",
      password: "apiteacher"
    }
  },
  testStudentCreds: {
    user: {
      username: "apistudent",
      password: "apistudent"
    }
  }
}

var readings = {
  newReading: {
    title: "Test Reading",
    html: "This is test content",
    words: [{"styles" : [ "p", "p-first"],"str" : "This"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p"],"str" : "is"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p"],"str" : "test"},{"styles" : [ "p", "space"],"str" : " "},{"styles" : [ "p", "p-last"],"str" : "content"},{"styles" : [ "br"],"str" : ""}]
  },
  testReading: {
    _id: "588194976f38d90011467cea"
  }
}

var projects = {
  newProject: {
    reading_id: "588194976f38d90011467cea",
    label: "50 shades of Edji",
    types: ["emoji", "text"]
  },
  invalidTypesProject: {
    reading_id: "588194976f38d90011467cea",
    label: "50 shades of Edji",
    types: ["something", "nothing"]
  }
}

var comments = {
  emojiComment: {
    start: 50,
    end: 73,
    type: "emoji",
    text: "It was the best of times, it was the worst of times",
    data: ":disappointed:"
  },
  textComment: {
    start: 50,
    end: 73,
    type: "text",
    text: "It was the best of times, it was the worst of times",
    data: "w00t"
  },
  emptyComment: {
    start: 50,
    end: 73,
    type: "text",
    text: "It was the best of times, it was the worst of times"
  },
  invalidComment: {
    data: "Japan is kind of scared of Russia"
  }
}

module.exports = {
  users: users,
  readings: readings,
  projects: projects,
  comments: comments
}
