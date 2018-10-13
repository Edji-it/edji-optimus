// library imports
const Q = require('q')
let mongoose = require( "mongoose")

// project imports
const Project = require('./../../../models/Project')

module.exports = function(req, res) {
  const project_id = req.params.project_id
  let populate = req.query.pop || []
  if (typeof populate == 'string') { // otherwise it's going to be an array of strings, which is what we want
    populate = [populate]
  }
  let findParams = {}

  //creates flexibility to use with either project code or with project id
  if (mongoose.Types.ObjectId.isValid(project_id)) {
    findParams._id = mongoose.Types.ObjectId(project_id)
  } else {
    findParams.code = project_id.toLowerCase()
  }
  
  Q(
    Project.aggregate([
      {
        $match: findParams
      }, {
        $lookup: {
          from: "readings",
          localField: "reading_id",
          foreignField: "_id",
          as: "reading"
        }
      }, {
        $addFields: {
          "reading_id": {
            _id: {$arrayElemAt: ["$reading._id", 0]},
            words: {$arrayElemAt: ["$reading.words", 0]},
            title: {$arrayElemAt: ["$reading.title", 0]}, 
            owner_id: {$arrayElemAt: ["$reading.owner_id", 0]}, 
            teacher_ids: {$arrayElemAt: ["$reading.teacher_ids", 0]}, 
            public: {$arrayElemAt: ["$reading.public", 0]}, 
            promoter_ids: {$arrayElemAt: ["$reading.promoter_ids", 0]}, 
            source: {$arrayElemAt: ["$reading.source", 0]}, 
            cover_img: {$arrayElemAt: ["$reading.cover_img", 0]}, 
            tags: {$arrayElemAt: ["$reading.tags", 0]}, 
            draft: {$arrayElemAt: ["$reading.draft", 0]}, 
            version_id: {$arrayElemAt: ["$reading.version_id", 0]}, 
            questions: {$arrayElemAt: ["$reading.questions", 0]}, 
            parent_id: {$arrayElemAt: ["$reading.parent_id", 0]}
          }
        }
      }, {
        $lookup: {
          from: "users",
          localField: "teacher_id",
          foreignField: "_id",
          as: "teacherRef"
        }
      }, {
        $addFields: {
          "teacher": {
            _id: {$arrayElemAt: ["$teacherRef._id", 0]},
            fullname: {$arrayElemAt: ["$teacherRef.fullname", 0]},
            username: {$arrayElemAt: ["$teacherRef.username", 0]}
          }
        }
      }
    ]).exec()
  )
  .then((project) => {
    // if project is null (meaning it did not exist in the collection)
    if (!project || project.length < 1) {
      return res.status(404).send()
    }
    // aggregate returns as an array, we need this to just be the set of properties
    project = project[0]
    // clear out the properties that we don't need
    delete project.teacherRef
    delete project.reading
    // send back the project
    return res.status(200).send({ project: project })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}