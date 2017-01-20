var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")
// var server = "http://localhost:3354"
var should = chai.should()
var Q = require("q")

var User = require("./../models/User")
var data = require("./data")
var functions = require("./functions")

chai.use(chaiHttp)

describe("Users", () => {
    
    describe('POST /users', () => {
        it("it should register a user", (done) => {
            
            chai.request(server)
                .post("/users")
                .send({user: data.users.newUser})
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(201)
                    res.body.should.be.a("object")
                    res.body.should.have.property("token")
                    
                    //user validation
                    var user = res.body.user
                    user.should.have.property("_id")
                    user.should.have.property("username")
                    user.should.have.property("fullname")
                    user.should.have.property("email")
                    user.should.have.property("isTeacher")
                    user.should.have.property("createdAt")
                    user.should.have.property("updatedAt")
                    user.should.not.have.property("password")
                    user.should.not.have.property("resetPasswordToken")
                    user.should.not.have.property("resetPasswordExpires")
                    user.should.not.have.property("accountArchiveToken")

                    //token validation
                    var token = res.body.token
                    token.should.be.a("string")
                    token.should.not.equal("")
                    
                    done()
                })
        })

        it("it should not allow a duplicate user", (done) => {

            chai.request(server)
                .post("/users")
                .send({ user: data.users.duplicateUser })
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(409)
                    res.should.have.property("error")
                    done()
                })
        })

        it("it should catch profane names, usernames and invalid emails", (done) => {
            chai.request(server)
                .post("/users")
                .send({ user: data.users.badUser })
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(406)
                    res.should.have.property("error")
                    res.error.should.have.property("text")

                    // error response validation
                    var text = JSON.parse(res.error.text)
                    text.should.have.property("validationErrors")
                    text.validationErrors.should.be.a("object")

                    text.validationErrors.should.have.property("email")
                    text.validationErrors.email.should.be.a("string")
                    text.validationErrors.email.should.equal("emailRegex")

                    text.validationErrors.should.have.property("fullname")
                    text.validationErrors.fullname.should.be.a("string")
                    text.validationErrors.fullname.should.be.equal("badWords")

                    text.validationErrors.should.have.property("username")
                    text.validationErrors.username.should.be.a("string")
                    text.validationErrors.username.should.be.equal("badWords")
                    done()
                })
        })

        it("it should return 'required' errors for all missing fields that are required", (done) => {
            chai.request(server)
                .post("/users")
                .send({ user: { isTeacher: true } })
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(406)
                    res.should.have.property("error")
                    res.error.should.have.property("text")

                    // error response validation
                    var text = JSON.parse(res.error.text)
                    text.should.have.property("validationErrors")
                    text.validationErrors.should.be.a("object")

                    text.validationErrors.should.have.property("email")
                    text.validationErrors.email.should.be.a("string")
                    text.validationErrors.email.should.equal("required")

                    text.validationErrors.should.have.property("fullname")
                    text.validationErrors.fullname.should.be.a("string")
                    text.validationErrors.fullname.should.be.equal("required")

                    text.validationErrors.should.have.property("username")
                    text.validationErrors.username.should.be.a("string")
                    text.validationErrors.username.should.be.equal("required")

                    text.validationErrors.should.have.property("password")
                    text.validationErrors.password.should.be.a("string")
                    text.validationErrors.password.should.be.equal("required")
                    done()
                })
        })
    })
    
    describe("POST /users/login", () => {
        it("it should login an existing user", (done) => {

            chai.request(server)
                .post("/users/login")
                .send(data.users.testUserCreds)
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(200)
                    res.body.should.be.a("object")
                    res.body.should.have.property("user")
                    res.body.should.have.property("token")
                    
                    //user validation
                    var user = res.body.user
                    user.should.have.property("_id")
                    user.should.have.property("username")
                    user.should.have.property("fullname")
                    user.should.have.property("email")
                    user.should.have.property("isTeacher")
                    user.should.have.property("createdAt")
                    user.should.have.property("updatedAt")
                    user.should.not.have.property("password")
                    user.should.not.have.property("resetPasswordToken")
                    user.should.not.have.property("resetPasswordExpires")
                    user.should.not.have.property("accountArchiveToken")
                    
                    //token validation
                    var token = res.body.token
                    token.should.be.a("string")
                    token.should.not.equal("")
                    
                    done()
                })
        })

        it("it should login a user regardless of capitalization in username", (done) => {

            chai.request(server)
                .post("/users/login")
                .send(data.users.testUserCapitalCreds)
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(200)
                    res.body.should.be.a("object")
                    res.body.should.have.property("user")
                    res.body.should.have.property("token")
                    
                    done()
                })
        })

        it("it should return not found for a user with an incorrect password", (done) => {
            chai.request(server)
                .post("/users/login")
                .send(data.users.incorrectCredentials)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(404)
                    res.body.should.be.a("object")

                    done()
                })
        })

        it("it should reject a call without a user", (done) => {
            chai.request(server)
                .post("/users/login")
                .send({ nothing: {} })
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(400)
                    res.body.should.be.a("object")

                    done()
                })
        })

        it("it should reject a user without a username", (done) => {
            chai.request(server)
                .post("/users/login")
                .send({ user: { password: "hello" } })
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(400)
                    res.body.should.be.a("object")

                    done()
                })
        })

        it("it should reject a user without a password", (done) => {
            chai.request(server)
                .post("/users/login")
                .send({ user: { username: "hello" } })
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(400)
                    res.body.should.be.a("object")

                    done()
                })
        })
    })
})