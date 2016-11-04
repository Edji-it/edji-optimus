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

    var model = TempUser(userData);

    model.save((error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
            return;
        }
        result.type = "temp";

        

        res.json(LoginController.generateLoginObjectForUser(result));
    });

});

router.get("/:id", function(req, res) {

});

module.exports = router;