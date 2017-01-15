var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")
var should = chai.should()
var Q = require("q")

var User = require("./../models/User")
var data = require("./data")

// var testDB = require("./testdb")

chai.use(chaiHttp)

describe("Users", () => {
    
    describe('POST /users', () => {
        it("it should register a user", (done) => {
            
            chai.request(server)
                .post("/users")
                .send({user: data.users.testUser})
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(201)
                    res.body.should.be.a("object")
                    
                    //user validation
                    res.body.should.have.property("user")
                    res.body.user.should.have.property("_id")
                    res.body.user.should.have.property("username")
                    res.body.user.should.have.property("fullname")
                    res.body.user.should.have.property("email")
                    res.body.user.should.have.property("isTeacher")
                    res.body.user.should.have.property("createdAt")
                    res.body.user.should.have.property("updatedAt")
                    
                    //token validation
                    res.body.should.have.property("token")
                    done()
                })
        })

        it("it should not allow a duplicate user", (done) => {

            chai.request(server)
                .post("/users")
                .send({ user: data.users.testUser })
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(409)
                    res.should.have.property("error")
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

        it("it should reject a user with an incorrect password", (done) => {
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
    })
})