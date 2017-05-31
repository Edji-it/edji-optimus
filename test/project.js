var chai = require("chai")
var chaiHttp = require("chai-http")
var config = require("config")
var server = config.get("Testing.url")
var should = chai.should()
var Q = require("q")

var User = require("./../models/User")
var data = require("./data")
var functions = require("./functions")

chai.use(chaiHttp)

// variables stored for use in tests
var testProject
var testUsers // comes with testStudent, testTeacher and testTemp
var testComments = {}

describe("Projects", () => {

  before((done) => {
    functions.loginTestUsers().then((users) => {
      testUsers = users
      functions.createTempUser(data.users.tempUser)
        .then((user) => {
          testUsers.testTemp2 = user
          done()
        })
    })
  })

  describe("POST /projects", () => {
    it("it should create a new project", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: data.projects.newProject })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("project")

          // project validation
          var project = res.body.project
          testProject = project // store the project for use in later tests!
          project.should.have.property("_id")
          project.should.have.property("teacher_id")
            project.teacher_id.should.equal(testUsers.testTeacher.user._id)
          project.should.have.property("reading_id")
          project.should.have.property("label")
          project.should.have.property("code")
          project.should.have.property("types")
          project.should.have.property("temp_ids")
          project.should.have.property("students_ids")
          project.should.have.property("comments")
          project.should.have.property("updatedAt")
          project.should.have.property("createdAt")

          done()
        })
    })

    it("it should reject a request without a project", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ nothing: data.projects.newProject })
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("project")
          text.validationErrors.project.should.equal("required")

          done()
        })
    })

    it("it should return 'required' errors for all missing fields that are required", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: {missing: "everything"} })
        .end((err, res) => {
          // initial validation
          res.should.have.status(406)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("label")
          text.validationErrors.label.should.equal("required")

          text.validationErrors.should.have.property("reading_id")
          text.validationErrors.reading_id.should.equal("required")

          done()
        })
    })

    it("it should catch invalid types in `types` array", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: data.projects.invalidTypesProject })
        .end((err, res) => {
          // initial validation
          res.should.have.status(406)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("types.0")
          text.validationErrors["types.0"].should.equal("enum")

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .post("/projects")
        .send({ project: data.projects.newProject })
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("GET /projects/:id", () => {
    it("it should get a project for a teacher", (done) => {
      chai.request(server)
        .get("/projects/" + testProject._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("project")

          // students_ids validation
          var project = res.body.project
          project.should.have.property("students_ids")
          var students_ids = project.students_ids
          
          students_ids.should.be.instanceof(Array)
          students_ids.forEach((stuObj) => {
            stuObj.should.have.property("_id")
              stuObj._id.should.not.equal(testUsers.testTeacher.user._id)
            stuObj.should.have.property("fullname")
          })

          done()
        })
    })

    it("it should get a project for a student", (done) => {
      chai.request(server)
        .get("/projects/" + testProject._id)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("project")
          
          // project validation
          var project = res.body.project
          project.should.have.property("_id")
          project.should.have.property("teacher_id")
          project.should.have.property("reading_id")
          project.should.have.property("label")
          project.should.have.property("code")
          project.should.have.property("types")
          project.should.have.property("temp_ids")
          project.should.have.property("students_ids")
          project.should.have.property("comments")
          project.should.have.property("updatedAt")
          project.should.have.property("createdAt")

          // students_ids validation
          var studentExists = false
          var students_ids = project.students_ids
          students_ids.should.be.instanceof(Array)
          students_ids.forEach((stuObj) => {
            stuObj.should.have.property("_id")
            stuObj.should.have.property("fullname")
            if (stuObj._id === testUsers.testStudent.user._id) { studentExists = true }
          })
          studentExists.should.equal(true)

          done()
        })
    })

    it("it should get a project for a temp user", (done) => {
      chai.request(server)
        .get("/projects/" + testProject._id)
        .set("Authorization", testUsers.testTemp.token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("project")

          // students_ids validation
          var studentExists = false
          res.body.project.should.have.property("temp_ids")
          var temp_ids = res.body.project.temp_ids
          temp_ids.should.be.instanceof(Array)
          temp_ids.forEach((stuObj) => {
            stuObj.should.have.property("_id")
            stuObj.should.have.property("fullname")
            if (stuObj._id === testUsers.testTemp.user._id) { studentExists = true }
          })
          studentExists.should.equal(true)

          done()
        })
    })

    it("it should get a project by the project code", (done) => {
      chai.request(server)
        .get("/projects/" + testProject.code)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("project")

          // project validation
          var project = res.body.project
          project.should.have.property("_id")
          project.should.have.property("teacher_id")
          project.should.have.property("reading_id")
          project.should.have.property("label")
          project.should.have.property("code")
          project.should.have.property("types")
          project.should.have.property("temp_ids")
          project.should.have.property("students_ids")
          project.should.have.property("comments")
          project.should.have.property("updatedAt")
          project.should.have.property("createdAt")

          done()
        })
    })

    it("it should get a project even if the project code is capitalized", (done) => {
      chai.request(server)
        .get("/projects/" + testProject.code.toUpperCase())
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("project")

          done()
        })
    })

    it("it should return 404 when project is not found by id", (done) => {
      chai.request(server)
        .get("/projects/" + testUsers.testStudent.user._id) // this id will check out as an ObjectId in the back end, but is not a project id
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(404)

          done()
        })
    })

    it("it should return 404 when project is not found by code", (done) => {
      chai.request(server)
        .get("/projects/cody")
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(404)

          done()
        })
    })

    it("it should get a project for an unauthorized user", (done) => {
      chai.request(server)
        .get("/projects/" + testProject._id)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("project")
          res.body.project.should.be.a("object")

          done()
        })
    })
  })

  describe("GET /projects", () => {

    it("it should get a student's projects", (done) => {
      chai.request(server)
        .get("/projects")
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.be.instanceof(Array)

          // project validation
          var projects = res.body
          projects.length.should.be.above(0)
          projects.forEach((project) => {
            // make sure it's a project
            project.should.have.property("_id")

            // make sure it doesn't come with too much data
            project.should.not.have.property("comments")
            project.should.not.have.property("students_ids")
            project.should.not.have.property("temp_ids")
          })

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .get("/projects")
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })

    it("it should get a temp user's projects", (done) => {
      chai.request(server)
        .get("/projects")
        .set("Authorization", testUsers.testTemp.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.be.instanceof(Array)

          // project validation
          var projects = res.body
          projects.length.should.be.above(0)
          projects.forEach((project) => {
            // make sure it's a project
            project.should.have.property("_id")

            // make sure it doesn't come with too much data
            project.should.not.have.property("comments")
            project.should.not.have.property("students_ids")
            project.should.not.have.property("temp_ids")
          })

          done()
        })
    })
  })

  describe("GET /projects/:project_id/reading/:reading_id", () => {
    it("it should get all projects for a reading", (done) => {
      chai.request(server)
        .get("/projects/reading/" + testProject.reading_id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("projects")
          res.body.projects.should.be.instanceof(Array)

          // project validation
          var projects = res.body.projects
          projects.length.should.be.above(0)
          projects.forEach((project) => {
            // make sure it's a project
            project.should.have.property("_id")
            project.should.have.property("teacher_id")
              project.teacher_id.should.be.equal(testUsers.testTeacher.user._id)

            // TODO: front end uses these for count of comments and count of students - need to find a lighter way!
            // // make sure it doesn't come with too much data
            // project.should.not.have.property("comments")
            // project.should.not.have.property("students_ids")
            // project.should.not.have.property("temp_ids")
          })

          done()
        })
    })

    it("it should return empty array for nonexistant reading id", (done) => {
      chai.request(server)
        .get("/projects/reading/" + testUsers.testStudent.user._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("projects")
          res.body.projects.should.be.instanceof(Array)
          res.body.projects.length.should.be.equal(0)

          done()
        })
    })

    it("it should reject an invalid reading id", (done) => {
      chai.request(server)
        .get("/projects/reading/jfkldsaj")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(400)

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .get("/projects/reading/" + testProject.reading_id)
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("GET /projects/:code/validate", () => {
    it("it should validate an existing project", (done) => {
      chai.request(server)
        .get("/projects/" + testProject.code + "/validate")
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("_id")
          done()
        })
    })

    it("it should return 404 for invalid project", (done) => {
      chai.request(server)
        .get("/projects/demo/validate")
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe("POST /projects/:id/comments", () => {
    it("it should create an emoji comment", (done) => {
      chai.request(server)
        .post("/projects/" + testProject._id + "/comments")
        .set("Authorization", testUsers.testStudent.token)
        .send({ comment: data.comments.emojiComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("comment")

          // comment validation
          var comment = res.body.comment
          testComments.emojiComment = comment
          comment.should.have.property("_id")
          comment.should.have.property("user_id")
            comment.user_id.should.equal(testUsers.testStudent.user._id)
          comment.should.have.property("author")
            comment.author.should.equal(testUsers.testStudent.user.fullname)
          comment.should.have.property("start")
          comment.should.have.property("end")
          comment.should.have.property("type")
            comment.type.should.be.equal("emoji")
          comment.should.have.property("end")
          comment.should.have.property("data")
          comment.should.have.property("text")
          comment.should.have.property("updatedAt")
          comment.should.have.property("createdAt")

          done()
        })
    })

    it("it should create a text comment", (done) => {
      chai.request(server)
        .post("/projects/" + testProject._id + "/comments")
        .set("Authorization", testUsers.testStudent.token)
        .send({ comment: data.comments.textComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("comment")

          // comment validation
          var comment = res.body.comment
          testComments.textComment = comment
          comment.should.have.property("_id")
          comment.should.have.property("user_id")
            comment.user_id.should.equal(testUsers.testStudent.user._id)
          comment.should.have.property("author")
            comment.author.should.equal(testUsers.testStudent.user.fullname)
          comment.should.have.property("start")
          comment.should.have.property("end")
          comment.should.have.property("type")
            comment.type.should.be.equal("text")
          comment.should.have.property("end")
          comment.should.have.property("data")
          comment.should.have.property("text")
          comment.should.have.property("updatedAt")
          comment.should.have.property("createdAt")

          done()
        })
    })

    it("it should create an empty comment", (done) => {
      chai.request(server)
        .post("/projects/" + testProject._id + "/comments")
        .set("Authorization", testUsers.testStudent.token)
        .send({ comment: data.comments.emptyComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("comment")

          // comment validation
          var comment = res.body.comment
          testComments.emptyComment = comment
          comment.should.have.property("_id")
          comment.should.have.property("user_id")
            comment.user_id.should.equal(testUsers.testStudent.user._id)
          comment.should.have.property("author")
            comment.author.should.equal(testUsers.testStudent.user.fullname)
          comment.should.have.property("start")
          comment.should.have.property("end")
          comment.should.have.property("type")
            comment.type.should.be.equal("text")
          comment.should.have.property("end")
          comment.should.have.property("text")
          comment.should.have.property("updatedAt")
          comment.should.have.property("createdAt")

          comment.should.not.have.property("data")

          done()
        })
    })

    it("it should update an existing comment", (done) => {
      var updatedComment = {}
      Object.assign(updatedComment, testComments.emptyComment)
      updatedComment.data = "updated"

      chai.request(server)
        .post("/projects/" + testProject._id + "/comments")
        .set("Authorization", testUsers.testStudent.token)
        .send({ comment: updatedComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("comment")

          // comment validation
          var comment = res.body.comment
          comment.should.have.property("data")
            comment.data.should.be.equal(updatedComment.data)
          comment.should.have.property("updatedAt")
          comment.should.have.property("createdAt")
          let updatedAt = new Date(comment.updatedAt).getTime()
          let createdAt = new Date(comment.createdAt).getTime()
          updatedAt.should.be.above(createdAt)

          done()
        })
    })

    // Need to modify things so that we can have requirements again - it was breaking projects b/c some comments don't have starts and ends
    // it("it should send validation errors for required fields", (done) => {
    //   chai.request(server)
    //     .post("/projects/" + testProject._id + "/comments")
    //     .set("Authorization", testUsers.testStudent.token)
    //     .send({ comment: data.comments.invalidComment })
    //     .end((err, res) => {
    //       // initial validation
    //       res.should.have.status(406)
    //       res.should.have.property("error")
    //       res.error.should.have.property("text")

    //       // error validation
    //       var text = JSON.parse(res.error.text)
    //       text.should.have.property("validationErrors")

    //       var start = false
    //       var end = false
    //       var user_id = false

    //       // this will fail if a comment is added, so you have to change it to the proper number
    //       text.validationErrors.should.not.have.property("comments.3.user_id")

    //       text.validationErrors.should.have.property("comments.3.start")
    //       text.validationErrors["comments.3.start"].should.equal("required")

    //       text.validationErrors.should.have.property("comments.3.end")
    //       text.validationErrors["comments.3.end"].should.equal("required")

    //       done()
    //     })
    // })

    it("it should reject if project id is not valid", (done) => {
      chai.request(server)
        .post("/projects/fdjaklfdl/comments")
        .set("Authorization", testUsers.testStudent.token)
        .send({ comment: data.comments.emptyComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)

          done()
        })
    })

    it("it should reject a call without a comment", (done) => {
      chai.request(server)
        .post("/projects/" + testUsers.testStudent.user._id + "/comments")
        .set("Authorization", testUsers.testStudent.token)
        .send({ stupid: data.comments.emptyComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)

          done()
        })
    })

    it("it should return 404 for project not found", (done) => {
      chai.request(server)
        .post("/projects/" + testUsers.testStudent.user._id + "/comments") // it won't find a project with this id, but the id is valid
        .set("Authorization", testUsers.testStudent.token)
        .send({ comment: data.comments.emptyComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(404)

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .post("/projects/" + testProject._id + "/comments")
        .send({ comment: data.comments.emojiComment })
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("PUT /projects/:id/user_id", () => {
    it("should add a temp id to a project", (done) => {
      // make sure that id isn't already there
      testProject.temp_ids.indexOf(testUsers.testTemp.user._id).should.be.equal(-1)

      chai.request(server)
        .put("/projects/" + testProject._id + "/user_id")
        .set("Authorization", testUsers.testTemp2.token)
        .end((err, res) => {
          res.should.have.status(200)
          done()
        })
    })

    it("should reject a corrupt project id", (done) => {
      chai.request(server)
        .put("/projects/hahaha/user_id")
        .set("Authorization", testUsers.testTemp.token)
        .end((err, res) => {
          res.should.have.status(400)
          done()
        })
    })

    it("should return 404 if the project does not exist", (done) => {
      chai.request(server)
        .put("/projects/" + testUsers.testTemp.user._id + "/user_id")
        .set("Authorization", testUsers.testTemp.token)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it("should return 401 if sent without a bad Authorization token", (done) => {
      chai.request(server)
        .put("/projects/" + testProject._id + "/user_id")
        .end((err, res) => {
          res.should.have.status(401)
          done()
        })
    })
  })

  describe("DELETE /projects/:project_id/comments/:comment_id", () => {
    it("it should reject an invalid project id", (done) => {
      chai.request(server)
        .del("/projects/jkfdjaklfd/comments/" + testComments.emojiComment._id)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          res.should.have.status(400)
          res.should.have.property("error")
          res.error.should.have.property("text")

          // error validation
          var text = JSON.parse(res.error.text)
          text.should.have.property("badRequest")
          text.badRequest.should.have.property("projectId")
          text.badRequest.projectId.should.equal("invalid")

          done()
        })
    })

    it("it should reject an invalid comment id", (done) => {
      chai.request(server)
        .del("/projects/" + testProject._id + "/comments/fjdklja")
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          res.should.have.status(400)
          res.should.have.property("error")
          res.error.should.have.property("text")

          // error validation
          var text = JSON.parse(res.error.text)
          text.should.have.property("badRequest")
          text.badRequest.should.have.property("commentId")
          text.badRequest.commentId.should.equal("invalid")

          done()
        })
    })

    // // this test currently doesn't do anything good because we don't know if it actually updated or not
    // it("it should reject a delete attempt from a user who is not the owner", (done) => {
    //   chai.request(server)
    //     .del("/projects/" + testProject._id + "/comments/" + testComments.emojiComment._id)
    //     .set("Authorization", testUsers.testTeacher.token)
    //     .end((err, res) => {
    //       res.should.have.status(401)

    //       done()
    //     })
    // })

    it("it should return 404 for non existant project", (done) => {
      chai.request(server)
        .del("/projects/" + testUsers.testTeacher.user._id + "/comments/" + testComments.emojiComment._id)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .del("/projects/" + testUsers.testTeacher.user._id + "/comments/" + testComments.emojiComment._id)
        .end((err, res) => {
          res.should.have.status(401)
          done()
        })
    })

    // this should come LAST in the comments tests because it actually deletes the comment
    it("it should delete a comment for the comment owner", (done) => {
      chai.request(server)
        .del("/projects/" + testProject._id + "/comments/" + testComments.emojiComment._id)
        .set("Authorization", testUsers.testStudent.token) // this must be equal to the id of the user who created the comment
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    })

    // this should come LAST in the comments tests because it actually deletes the comment
    it("it should delete a comment for the project owner", (done) => {
      chai.request(server)
        .del("/projects/" + testProject._id + "/comments/" + testComments.textComment._id)
        .set("Authorization", testUsers.testTeacher.token) // this must be equal to the id of the user who created the comment
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    })
  })

  describe("PUT /projects/:id", () => {
    it("it should successfully update heat vision", (done) => {
      chai.request(server)
        .put("/projects/" + testProject._id)
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: { heat_vision: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("project")
          
          // project validation
          let project = res.body.project
          project.should.have.property("heat_vision")
          project.heat_vision.should.be.equal(true);

          done()
        })
    })

    it("it should reject a call without a project", (done) => {
      chai.request(server)
        .put("/projects/" + testProject._id)
        .set("Authorization", testUsers.testTeacher.token)
        .send({ notProject: { heat_vision: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)
          done()
      })
    })

    it("it should reject an invalid id", (done) => {
      chai.request(server)
        .put("/projects/brennen")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: { heat_vision: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)

          done()
      })
    })

    it("it should return 404 for a non-existant id", (done) => {
      chai.request(server)
        .put("/projects/" + testUsers.testTeacher.user._id) // this id shouldn't exist in projects
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: { heat_vision: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(404)

          done()
        })
    })

    it("it should not allow the update of fields which don't exist", (done) => {
      chai.request(server)
        .put("/projects/" + testProject._id)
        .set("Authorization", testUsers.testTeacher.token)
        .send({ project: { non_existant: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("project")
          
          // project validation
          let project = res.body.project
          project.should.not.have.property("non_existant")

          done()
        })
    })

    it("it should return 404 if the auth token does not match the owner's", (done) => {
      chai.request(server)
        .put("/projects/" + testProject._id)
        .set("Authorization", testUsers.testStudent.token)
        .send({ project: { heat_vision: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(404)

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .put("/projects/" + testProject._id)
        .send({ project: { heat_vision: true }})
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })


  describe("DELETE /projects", () => {
    it("it should reject an invalid project id", (done) => {
      chai.request(server)
        .del("/projects/fjdsklajfd")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(400)
          done()
        })
    })

    it("it should return 404 for project that does not exist", (done) => {
      chai.request(server)
        .del("/projects/" + testUsers.testTeacher.user._id) // this is a teacher's id, and will not be a project
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    // this test has to be the very last test in the /projects suite! It deletes the created test project
    it("it should delete a project", (done) => {
      chai.request(server)
        .del("/projects/" + testProject._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    })
  })
})