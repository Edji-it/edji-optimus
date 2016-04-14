/**
 * Created by bvfergus on 3/5/16.
 */

    /*
    create: Create/Save/Update
    read: Read single (by ID)
    delete: Delete
    list: Get List
     */
var o = {create:true, read:true, "delete":true, list:true};

module.exports = function MountModelToRouter(router, Model, name, options){

    options = options || o;

    options.list &&
    router.get("/", function(req, res){
        Model.find({}, function(error, results){
            error && console.log(error);
            results && res.json(results);
        })
    });

    options.read &&
    router.get("/:id", function (req, res){
        Model.find({"_id":req.params.id}, function(error, result){
            error && console.log(error);
            // find returns an array, and we should only be getting one item back
            result && res.json( result.pop() );
        })
    });

    options.delete &&
    router.delete("/:id", function (req, res){
        Model.find({"_id":req.params.id}, function(error, result){
            error && console.log(error);
            // delete the result we got back;
            !error && result.remove() && res.json( {success:true} );
        })
    });

    options.create &&
    router.post("/", function(req, res) {

        console.log("Post received!");

        if (!req.body[name]) {
            //send error
            return;
        }

        var instanceData = req.body[name];
        var model = Model(instanceData);

        model.save((error, result)=>{
            console.log(error);
            res.json(result);
        })

    });
};
