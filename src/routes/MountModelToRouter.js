/**
 * Created by bvfergus on 3/5/16.
 */

/*
create: Create/Save/Update
read: Read single (by ID)
delete: Delete
list: Get List
 */
var options = { create: true, read: true, delete: true, list: true }

module.exports = function MountModelToRouter(router, Model, name, _options) {

    if (_options) {
        options = Object.assign(options, _options)
    }

    options.list &&
        router.get("/", function (req, res) {
            Model.find({}, function (error, results) {
                error && console.error(error)
                results && res.json(results)
            })
        })

    options.read &&
        router.get("/:id", function (req, res, next) {
            if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                // Yes, it's a valid ObjectId, proceed with `findById` call.
                Model.findOne({ "_id": req.params.id }, function (error, result) {
                    if (error) {
                        next(error)
                    } else if (result) {
                        res.status(200).send(result)
                    } else {
                        res.status(404).send()
                    }
                    return
                })
            } else {
                res.status(400).send()
            }

        })

    options.delete &&
        router.delete("/:id", function (req, res) {
            Model.remove({ "_id": req.params.id }, function (error) {
                error && console.error(error)
                // delete the result we got back
                !error && res.json({ success: true })
            })
        })

    options.create &&
        router.post("/", function (req, res, next) {
            if (!req.body[name]) {
                //send error
                return
            }

            var instanceData = req.body[name]
            var model = Model(instanceData)

            model.edjiSave()
                .then(() => {
                    return res.json(result)
                })
                .catch((err) => {
                    return next(err)
                })

        })
}
