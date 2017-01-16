var express = require("express");
var TempUser = require("./../models/TempUser");
var LoginController = require("./../LoginController");
// var MountModelToRouter = require("./MountModelToRouter");
var router = express.Router();

// MountModelToRouter(router, TempUser, "tempuser", {read: false, delete: false, list: false});

router.post("/", function(req, res) {
    var userData = req.body.user;

    if (!userData) {
        res.status(400).send({ validationErrors: { user: "required" } });
        return;
    }

    //create and save temp user
    var model = TempUser(userData);
    model.save((error, result) => {
        if (error) {
            if (error.name === "ValidationError") {
                var errors = {};

                for (var property in error.errors) {
                    if (error.errors[property].kind === "user defined") {
                        errors[property] = error.errors[property].properties.kind;
                    } else {
                        errors[property] = error.errors[property].kind;
                    }
                }

                res.status(406).send({ validationErrors: errors });
                return;
            } else if (error.code === 11000) {
                res.status(409).send();
                return;
            } else {
                console.error(error);
                res.status(500).send();
                return;
            }
        } else {
            res.status(201).send(LoginController.generateLoginObjectForUser(result));
        }

    });

});

module.exports = router;