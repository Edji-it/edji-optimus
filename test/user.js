var chai = require("chai");
var chaiHttp = require("chai-http");
var server = require("./../index");
var should = chai.should();

var User = require("./../models/User");
var db = require("./db");

chai.use(chaiHttp);

describe("Users", () => {
    beforeEach(db.seedDB);
    
    describe('POST /users', () => {
        it("it should register a user", (done) => {
            
            chai.request(server)
                .post("/users")
                .send({user: db.users.newUser})
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    
                    //user validation
                    res.body.should.have.property("user");
                    res.body.user.should.have.property("_id");
                    res.body.user.should.have.property("username");
                    res.body.user.should.have.property("fullname");
                    res.body.user.should.have.property("email");
                    res.body.user.should.have.property("isTeacher");
                    res.body.user.should.have.property("createdAt");
                    res.body.user.should.have.property("updatedAt");
                    
                    //token validation
                    res.body.should.have.property("token");
                    done();
                });
        });

        it("it should not allow a duplicate user", (done) => {

            chai.request(server)
                .post("/users")
                .send({ user: db.users.existingUser })
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(409);
                    res.should.have.property("error");
                    done();
                });
        });
    });
    
    describe("POST /users/login", () => {
        it("it should login an existing user", (done) => {

            chai.request(server)
                .post("/users/login")
                .send(db.users.existingUserCredentials)
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    
                    //user validation
                    res.body.should.have.property("user");
                    res.body.user.should.have.property("_id");
                    res.body.user.should.have.property("username");
                    res.body.user.should.have.property("fullname");
                    res.body.user.should.have.property("email");
                    res.body.user.should.have.property("isTeacher");
                    res.body.user.should.have.property("createdAt");
                    res.body.user.should.have.property("updatedAt");
                    
                    //token validation
                    res.body.should.have.property("token");
                    
                    done();
                });
        });

        it("it should reject a user with an incorrect password", (done) => {
            chai.request(server)
                .post("/users/login")
                .send(db.users.incorrectCredentials)
                .end((err, res) => {
                    // initial validation
                    res.should.have.status(400);
                    res.body.should.be.a("object");

                    done();
                });
        });
    });
});