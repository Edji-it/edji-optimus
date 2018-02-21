var chai = require("chai")
var chaiHttp = require("chai-http")
var server = "http://localhost:3354"
// var should = chai.should()

chai.use(chaiHttp)

var Q = require("q")

var users = {
  newUser:{
    username: Date.now().toString(),
    fullname: "newApiTestUser",
    password: "codycodycody",
    email: Date.now().toString() + "@cody.cod",
    identities: ["teacher", "business"],
    avatar: "//image-dev.edji.it/avatar/test.png"
  },
  duplicateUser: {
    username: "optimusprime",
    password: "optimusprime",
    fullname: "Optimus Prime",
    email: "Optimus@prime.ed",
    identities: ["robot"]
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
    username: "fuck",
    fullname: "twot",
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
    _id: "59bd93285239f3001105dbab"
  },
  updateReading: { // this reading contains properties acceptable to update by PUT /readings/:id
    html: "<p>This is definitely new content</p>",
    words: [{"styles": ["p", "p-first"], "str": "Done!"}],
    title: "Test reading updated title",
    public: true,
    source: "http://something.com",
    cover_img: "https://pbs.twimg.com/media/C52NouDWUAEUc5D.jpg",
    tags: [{ userId: "58c490e8385fe5cc4b10eab1", values: ["wot in titration"] }],
    draft: true
  }
}

var projects = {
  newProject: {
    reading_id: readings.testReading._id,
    label: "50 shades of Edji",
    types: ["emoji", "text"]
  },
  invalidTypesProject: {
    reading_id: readings.testReading._id,
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
