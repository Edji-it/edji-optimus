/**
 * Created by bvfergus on 4/13/16.
 */
var express = require( "express");
var Comment = require("./../models/Comment");
var MountModelToRouter = require("./MountModelToRouter");

var router = express.Router();

MountModelToRouter(router, Comment, "comment");

module.exports = router;