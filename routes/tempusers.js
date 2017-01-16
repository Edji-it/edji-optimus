var express = require("express");
var TempUser = require("./../models/TempUser");
var LoginController = require("./../LoginController");
// var MountModelToRouter = require("./MountModelToRouter");
var router = express.Router();

// MountModelToRouter(router, TempUser, "tempuser", {read: false, delete: false, list: false});

router.post("/", function(req, res) {
    var userData = req.body.user;

    if (!userData) {
        res.status(400).send();
        return;
    }

    //create and save temp user
    var model = TempUser(userData);
    model.save((error, result) => {
        if (error) {
            if (error.name === "ValidationError") {
                res.status(406).send();
                return;
            } else {
                console.log(error);
                res.status(500).send();
                return;
            }            
        }

        //creates the proper schema for the temp user's login token
        result.type = "temp";
        res.status(201).send(LoginController.generateLoginObjectForUser(result));
    });

});

module.exports = router;