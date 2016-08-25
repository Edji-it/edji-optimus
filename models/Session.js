/**
 * Created by nard on 8/21/16.
 */
var ModelCreator = require("./ModelCreator");
var Comment = require("./Comment");

module.exports = ModelCreator("Session", {
    reading_id:{type:String, required:true},
    teacher_id:{type:String
                        //,required:true
                },
    comments:[Comment.schema],
    students_ids:[],
    label:{type:String, required:true}
});