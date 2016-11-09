var chai = require("chai");
var chaiHttp = require("chai-http");
var server = require("./../index");
var should = chai.should();

var User = require("./../models/User");

chai.use(chaiHttp);

describe("Users", () => {
    beforeEach((done) => {
      User.remove({}, (err) => {
          done();
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
    });
    
    describe("POST /users/login", () => {
        it("it should login an existing user", (done) => {
            var userData = {
                username:"corbin",
                fullname:"corbin fonville",
                password:"corbinPass",
                email:"corbin.fonville@gmail.com",
                isTeacher: false
            };
            
            var userLogin = {
                user: {
                    username: userData.username,
                    password: userData.password
                }
            };
            
            User(userData).save((err, user) => {
                
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
});