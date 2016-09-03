/**
 * Created by bvfergus on 3/5/16.
 */

var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var User = require("./models/User");
var LoginController = require("./LoginController");

console.log("test");
//routers
var users = require("./routes/users");
var readings = require("./routes/readings");
var comments = require("./routes/comments");
var sessions = require("./routes/sessions");

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);

//wires socket.io for sessions
var globalUsers = 0;
var sessionObjs = {};
io.on('connection', function(socket) {
    var thisSessionId;

    // socket.emit('test','this has been a test');
    socket.on('newSession', function(sessionId) {
        thisSessionId = sessionId.id;
        socket.join(thisSessionId);

        if (sessionObjs[thisSessionId] && sessionObjs[thisSessionId] > 0) {
            sessionObjs[thisSessionId]++;
        } else {
            sessionObjs[thisSessionId] = 1;
        }
        io.to(thisSessionId).emit('liveUsers',sessionObjs[thisSessionId]);
    });

    socket.on('disconnect', function() {
        // this.id is the socket id
        sessionObjs[thisSessionId]--;
        io.to(thisSessionId).emit('liveUsers',sessionObjs[thisSessionId]);
    });
});


app.use(bodyParser());
app.use(LoginController.middleware);

// Access allowed for development
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', '*');
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', true);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use("/users",users);
app.use("/readings",readings);
app.use("/sessions",sessions);
//app.use("/comments", comments);
app.post("/login", function(req, res){
    var user = req.body.user;
    user.username = req.body.user.username;

    LoginController.login(user)
        .then(function(result){
            res.json(result);
        }).fail(function(err){
            res.status("400");
            res.json({error:err});
        });

});
app.post("/register", function(req, res){


    if (!req.body["user"]) {
        //send error
        return;
    }

    var userData = req.body.user;
    userData.username = req.body.user.username;

    var model = User(userData);

    model.save((error, result)=>{
        // console.log(error);
        //res.json(result);
        if (error){
            console.log(error);
            res.json(error);
            return;
        }

        res.json( LoginController.generateLoginObjectForUser(result));
    });

});
app.get("/user", function(req, res){

    req.user && res.send(req.user);

    !req.user && res.status(400) && res.send({error:"Not Logged In"});
});

var port = process.env.PORT || 3354;

server.listen(port);

console.log("Connected at " + port);
