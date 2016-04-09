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
            // find returns an array, and we should only be getting one item back
            result && res.json( result.pop() );
        })
    });

    router.post("/", function(req, res) {

        console.log("Post received!");

        if (!req.body[name]) {
            //send error
            return;
        }

        console.log( req.body[name] );

        var instanceData = req.body[name];

        var model = Model(instanceData);

        console.log(model);

        model.save((error, result)=>{
            console.log("model save");
            console.log(result)
            console.log(error);
            res.json(result);
        })

    });
}
