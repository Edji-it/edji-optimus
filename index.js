/**
 * Created by bvfergus on 3/5/16.
 */

var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var User = require("./models/User");
var LoginController = require("./LoginController");
var util = require('util');

//routers
var users = require("./routes/users");
var tempusers = require("./routes/tempusers");
var readings = require("./routes/readings");
var comments = require("./routes/comments");
var sessions = require("./routes/sessions");

var app = express();

var server = require('http').createServer(app);
require("./Sockets.js")(server);

app.use(bodyParser.json({limit: '5mb'}));
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

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, accept, origin');

    if(req.headers['access-control-request-headers']) {
        console.log("Not capitalized");
        console.log(req.headers['access-control-request-headers']);

        res.header('access-control-allow-headers', req.headers['access-control-request-headers']);
        oneof = true;
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use("/users",users);
app.use("/tempusers", tempusers);
app.use("/readings",readings);
app.use("/sessions",sessions);

var port = process.env.PORT || 3354;

server.listen(port);

console.log("Server connected at " + port);

module.exports = server;