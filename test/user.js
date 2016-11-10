var chai = require("chai");
var chaiHttp = require("chai-http");
var server = require("./../index");
var should = chai.should();

var User = require("./../models/User");

chai.use(chaiHttp);

var globalUser = {
    username:"nennerB",
    fullname:"nennerB nilkciH",
    password:"nennerbPass",
    email:"nennerb.nilkcih@gmail.com",
    isTeacher: false
};


describe("Users", () => {
    beforeEach((done) => {
      User.remove({}, (err) => {
        
        User(globalUser).save((err) => {
            if (err) {
                console.error("Unable to save seed user for testing");
                console.error(err);
            }

            done();
        });
        
      });
    });
    
    describe('POST /users', () => {
        it("it should register a user", (done) => {
            var user = {
                user: {
                    username:"corbin",
                    fullname:"corbin fonville",
                    password:"corbinPass",
                    email:"corbin.fonville@gmail.com",
                    isTeacher: true
                }
            };
            
            chai.request(server)
            .post("/users")
            .send(user)
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
            var user = {
                user: {
                    username:"nennerB",
                    fullname:"nennerB nilkciH",
                    password:"nennerbPass",
                    email:"brennen.nilkcih@gmail.com",
                    isTeacher: false
                }
            };

            User(user).save((err) => {
                chai.request(server)
                .post("/users")
                .send(user)
                .end((err, res) => {
                    //initial validation
                    res.should.have.status(400);
                    res.should.have.property("error");
                    done();
                });
            });
        });
    });
    
    describe("POST /users/login", () => {
        it("it should login an existing user", (done) => {
            
            var userLogin = {
                user: {
                    username: globalUser.username,
                    password: globalUser.password
                }
            };
            

            chai.request(server)
            .post("/users/login")
            .send(userLogin)
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
    });
});