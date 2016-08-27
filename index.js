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

io.on('connection', function() {
    console.log('user connected');
    io.emit('test', {});
});

app.use(bodyParser());
app.use(LoginController.middleware);

// Access allowed for development
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', '*');
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

    var model = User(userData);

    model.save((error, result)=>{
        // console.log(error);
        //res.json(result);
        if (error){
            res.json(error);
        }

        res.json( LoginController.generateLoginObjectForUser(result));
    });

});
app.get("/user", function(req, res){

    req.user && res.send(req.user);

    !req.user && res.status(400) && res.send({error:"Not Logged In"});
});

var port = process.env.PORT || 3354;

app.listen(port);
