const chai = require("chai")
const chaiHttp = require("chai-http")
const config = require("config")
const server = config.get("Testing.url")
const should = chai.should()
const Q = require("q")
const uuid = require("uuid")

// var server = require("./../index")
var User = require("./../models/User")
var data = require("./data")
var functions = require("./functions")

chai.use(chaiHttp)

var testUsers // comes with testStudent, testTeacher and testTemp

describe("Users", () => {
    before((done) => {
        functions.loginTestUsers().then((users) => {
            testUsers = users
            done()
        })
    })

    describe('POST /users', () => {
        describe("Standard registration", () => {
            it("should register a user", (done) => {
                
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
                        user.should.have.property("createdAt")
                        user.should.have.property("updatedAt")
                        user.should.have.property("avatar")
                        user.should.not.have.property("password")
                        user.should.not.have.property("resetPasswordToken")
                        user.should.not.have.property("resetPasswordExpires")
                        user.should.not.have.property("accountArchiveToken")

                        //token validation
                        var token = res.body.token
                        token.should.be.a("string")
                        token.should.not.equal("")

                        testUsers.newUser = res.body
                        
                        done()
                    })
            })

            it("should not allow a duplicate user", (done) => {

                chai.request(server)
                    .post("/users")
                    .send({ user: data.users.duplicateUser })
                    .end((err, res) => {
                        //initial validation
                        res.should.have.status(406)
                        done()
                    })
            })

            it("should catch profane names, usernames and invalid emails", (done) => {
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

            it("should return 'required' errors for all missing fields that are required", (done) => {
                chai.request(server)
                    .post("/users")
                    .send({ user: { identities: ["teacher"] } })
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

                        text.validationErrors.should.have.property("auth")
                        text.validationErrors.auth.should.be.a("string")
                        done()
                    })
            })
        })
    })

    describe("GET /users/:id", () => {
        it("should return a user", (done) => {
            chai.request(server)
                .get("/users/" + testUsers.testStudent.user._id)
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(200)
                    res.body.should.be.a("object")

                    //user validation
                    var user = res.body.user
                    user.should.have.property("_id")
                    user.should.have.property("username")
                    user.should.have.property("fullname")
                    user.should.have.property("email")
                    user.should.have.property("createdAt")
                    user.should.have.property("updatedAt")
                    user.should.not.have.property("password")
                    user.should.not.have.property("resetPasswordToken")
                    user.should.not.have.property("resetPasswordExpires")
                    user.should.not.have.property("accountArchiveToken")

                    done()
                })
        })

        it("should receive 400 for an invalid id", (done) => {
            chai.request(server)
                .get("/users/corbin")
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(400)

                    done()
                })
        })

        it("should receive 401 for id which does not exist", (done) => {
            chai.request(server)
                .get("/users/57bf5b422af8bc9a5a0fbae1")
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(401)

                    done()
                })
        })

        it("should receive 401 if passed without the Authorization header", (done) => {
            chai.request(server)
                .get("/users/" + testUsers.testStudent.user._id)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(401)

                    done()
                })
        })

        it("should receive 401 if the token does not match the requested id", (done) => {
            chai.request(server)
                .get("/users/" + testUsers.testStudent.user._id)
                .set("Authorization", testUsers.testTeacher.token)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(401)

                    done()
                })
        })
    })

    describe('PUT /users', () => {

        it("should update a user", (done) => {

            let userUpdate = {
                fullname: uuid.v4(),
                email: uuid.v4() + "@gmail.com",
                prefs: {
                    recentEmoji: [uuid.v4(), uuid.v4()]
                },
                media: {
                    images: [{ title: uuid.v4(), url: "http://" + uuid.v4() }],
                    documents: [{ title: uuid.v4(), pages: ["http://" + uuid.v4()] }]
                }
            }

            chai.request(server)
                .put("/users")
                .set("Authorization", testUsers.testStudent.token)
                .send({ user: userUpdate})
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(200)
                    res.body.should.be.a("object")
                    
                    // properties a user should have
                    var user = res.body.user
                    user.should.have.property("_id")
                    user.should.have.property("username")
                    user.should.have.property("fullname")
                        user.fullname.should.be.equal(userUpdate.fullname)
                    user.should.have.property("email")
                        user.email.should.be.equal(userUpdate.email)
                    user.should.have.property("createdAt")
                    user.should.have.property("updatedAt")
                    user.should.have.property("prefs")
                    user.prefs.should.have.property("recentEmoji")
                        user.prefs.recentEmoji.should.be.instanceOf(Array)
                        user.prefs.recentEmoji.length.should.be.equal(2)
                        user.prefs.recentEmoji[0].should.be.equal(userUpdate.prefs.recentEmoji[0])
                        user.prefs.recentEmoji[1].should.be.equal(userUpdate.prefs.recentEmoji[1])
                    user.should.have.property("media")
                    user.media.should.have.property("images")
                        user.media.images.should.be.instanceOf(Array)
                        user.media.images[0].should.have.property("title")
                            user.media.images[0].title.should.be.equal(userUpdate.media.images[0].title)
                        user.media.images[0].should.have.property("url")
                            user.media.images[0].url.should.be.equal(userUpdate.media.images[0].url),
                    user.media.should.have.property("documents")
                        user.media.documents.should.be.instanceOf(Array)
                        user.media.documents[0].should.have.property("title")
                            user.media.documents[0].title.should.be.equal(userUpdate.media.documents[0].title)
                        user.media.documents[0].should.have.property("pages")
                            user.media.documents[0].pages.should.be.instanceOf(Array)
                            user.media.documents[0].pages[0].should.be.equal(userUpdate.media.documents[0].pages[0])

                    // properties a user should not have
                    user.should.not.have.property("password")
                    user.should.not.have.property("resetPasswordToken")
                    user.should.not.have.property("resetPasswordExpires")
                    user.should.not.have.property("accountArchiveToken")

                    // chai.request(server)
                    //     .get("/users/" + testUsers.testStudent.user._id)
                    //     .set("Authorization", testUsers.testStudent.token)
                    //     .end((err, res) => {
                    //         // initial validation
                    //         res.should.have.status(200)
                    //         res.body.should.be.a("object")

                    //         //user validation
                    //         var user = res.body.user
                    //         user.should.have.property("_id")
                    //         user.should.have.property("username")
                    //         user.should.have.property("fullname")
                    //         user.should.have.property("email")
                    //         user.should.have.property("createdAt")
                    //         user.should.have.property("updatedAt")
                    //         user.should.not.have.property("password")
                    //         user.should.not.have.property("resetPasswordToken")
                    //         user.should.not.have.property("resetPasswordExpires")
                    //         user.should.not.have.property("accountArchiveToken")

                    //         done()
                    //     })
                    done()
                })
        })

        it("should catch profane names and invalid emails", (done) => {
            chai.request(server)
                .put("/users")
                .set("Authorization", testUsers.testStudent.token)
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
                    
                    done()
                })
        })
    })

    describe("DELETE /users/assets/:type/:asset_id", () => {
        let delTestUser // we'll get the user from the database and save it to this object first, so that we can reference it throughout the tests
        before((done) => {
            chai.request(server)
                .get("/users/" + testUsers.testStudent.user._id)
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.have.property("user")

                    // get the user and test to make sure it has the necessary properties (given by the above PUT /users/:id tests)
                    delTestUser = res.body.user
                    delTestUser.should.have.property("media")
                    delTestUser.media.should.have.property("images")
                    delTestUser.media.images.length.should.be.above(0)
                    done()
                })
        })

        it("should delete a property from a user object", (done) => {
            let delAsset = delTestUser.media.images[0]
            chai.request(server)
                .del("/users/assets/images/" + delAsset._id)
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    res.should.have.status(200)

                    res.body.should.have.property("file_locations")
                    res.body.file_locations.should.be.instanceOf(Array)
                    res.body.file_locations.length.should.be.above(0)
                    done()
                })
        })

        it("should return 404 for an id which does not exist within the array", (done) => {
            chai.request(server)
                .del("/users/assets/images/" + testUsers.testStudent.user._id) // not real likely that an asset will have this id
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    res.should.have.status(404)
                    done()
                })
        })

        it("should receive 400 if the requested :type is not allowable", (done) => {
            chai.request(server)
                .del("/users/assets/dumb/" + testUsers.testStudent.user._id) // this id will not exist on the assets
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    res.should.have.status(400)
                    done()
                })
        })

        it("should receive 400 if an invalid id is sent", (done) => {
            chai.request(server)
                .del("/users/assets/images/this_aint_no_id")
                .set("Authorization", testUsers.testStudent.token)
                .end((err, res) => {
                    res.should.have.status(400)
                    done()
                })
        })

        it("should receive 401 if sent without authorization", (done) => {
            chai.request(server)
                .del("/users/assets/images/" + testUsers.testStudent.user._id) // this id will not exist on the assets
                .end((err, res) => {
                    res.should.have.status(401)
                    done()
                })
        })
    })
    
    describe("POST /users/login", () => {
        it("should login an existing user", (done) => {

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

        it("should login a user regardless of capitalization in username", (done) => {

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

        it("should return 401 for a user with an incorrect password", (done) => {
            chai.request(server)
                .post("/users/login")
                .send(data.users.incorrectCredentials)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(401)
                    res.body.should.be.a("object")

                    done()
                })
        })

        it("should reject a call without a user", (done) => {
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

        it("should reject a user without a username", (done) => {
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

        it("should reject a user without a password", (done) => {
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

    // describe("PUT /user/following", () => {
    //     let user_id = testUsers.testTeacher.user._id

    //     before((done) => {
    //         chai.request(server)
    //         .put("/users/following")
    //         .set("Authorization", testUsers.newUser.token)
    //         .send({ action: "unfollow", user_id: user_id })
    //         .end((err, res) => {
    //             // there might be an error here or it might succeed, either way we only need to reset it so that the new user is not following testTeacher
    //             done()
    //         })
    //     })


    //     it("should follow a user", (done) => {
    //         chai.request(server)
    //         .put("/users/following")
    //         .set("Authorization", testUsers.newUser.token)
    //         .send({ action: "unfollow", user_id: user_id })
    //         .end((err, res) => {
    //             res.should.have.status(200)
    //             res.body.should.have.property("user")
    //             res.body.user.should.have.property("following")
    //             res.body.user.following.should.be.instanceOf(Array)
    //             res.body.user.following.indexOf(user_id).should.be.above(-1)
    //             done()
    //         })
    //     })
    // })
})