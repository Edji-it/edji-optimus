/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var User = require("./../models/User");
var MountModelToRouter = require("./MountModelToRouter");

var router = express.Router();

MountModelToRouter(router, User, "user");

module.exports = router;