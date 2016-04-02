/**
 * Created by bvfergus on 3/5/16.
 */



module.exports = function MountModelToRouter(router, Model, name){


    router.get("/", function(req, res){
        console.log("test");
        Model.find({}, function(error, results){
            error && console.log(error);
            results && res.json(results);
        })
    });

    router.get("/:id", function (req, res){

        Model.find({"_id":req.params.id}, function(error, result){
            error && console.log(error);
            result && res.json(result);
        })
    });

    router.post("/", function(req, res) {

        if (!req.body[name]) {
            //send error
            return;
        }


        var instanceData = req.body[name];

        var model = Model(instanceData);
        model.save((error, result)=>{
            res.json(result);
        })

    });
}
