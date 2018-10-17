// const populateUsers = [{
//   $lookup: {
//     from: "users",
//     localField: "teacher_id",
//     foreignField: "_id",
//     as: "teacherRef"
//   }
// }, {
//   $addFields: {
//     "teacher": {
//       _id: { $arrayElemAt: ["$teacherRef._id", 0] },
//       fullname: { $arrayElemAt: ["$teacherRef.fullname", 0] },
//       username: { $arrayElemAt: ["$teacherRef.username", 0] }
//     }
//   }
// }]

// const populateReadings = [{
//   $lookup: {
//     from: "readings",
//     localField: "reading_id",
//     foreignField: "_id",
//     as: "reading"
//   }
// }, {
//   $addFields: {
//     "reading_id": {
//       _id: { $arrayElemAt: ["$reading._id", 0] },
//       words: { $arrayElemAt: ["$reading.words", 0] },
//       title: { $arrayElemAt: ["$reading.title", 0] },
//       owner_id: { $arrayElemAt: ["$reading.owner_id", 0] },
//       teacher_ids: { $arrayElemAt: ["$reading.teacher_ids", 0] },
//       public: { $arrayElemAt: ["$reading.public", 0] },
//       promoter_ids: { $arrayElemAt: ["$reading.promoter_ids", 0] },
//       source: { $arrayElemAt: ["$reading.source", 0] },
//       cover_img: { $arrayElemAt: ["$reading.cover_img", 0] },
//       tags: { $arrayElemAt: ["$reading.tags", 0] },
//       draft: { $arrayElemAt: ["$reading.draft", 0] },
//       version_id: { $arrayElemAt: ["$reading.version_id", 0] },
//       questions: { $arrayElemAt: ["$reading.questions", 0] },
//       parent_id: { $arrayElemAt: ["$reading.parent_id", 0] }
//     }
//   }
// }]

const populationProperties = {
  'reading_id': [{
    $lookup: {
      from: "readings",
      localField: "reading_id",
      foreignField: "_id",
      as: "reading"
    }
  }, {
    $addFields: {
      "reading_id": {
        _id: { $arrayElemAt: ["$reading._id", 0] },
        words: { $arrayElemAt: ["$reading.words", 0] },
        title: { $arrayElemAt: ["$reading.title", 0] },
        owner_id: { $arrayElemAt: ["$reading.owner_id", 0] },
        teacher_ids: { $arrayElemAt: ["$reading.teacher_ids", 0] },
        public: { $arrayElemAt: ["$reading.public", 0] },
        promoter_ids: { $arrayElemAt: ["$reading.promoter_ids", 0] },
        source: { $arrayElemAt: ["$reading.source", 0] },
        cover_img: { $arrayElemAt: ["$reading.cover_img", 0] },
        tags: { $arrayElemAt: ["$reading.tags", 0] },
        draft: { $arrayElemAt: ["$reading.draft", 0] },
        version_id: { $arrayElemAt: ["$reading.version_id", 0] },
        questions: { $arrayElemAt: ["$reading.questions", 0] },
        parent_id: { $arrayElemAt: ["$reading.parent_id", 0] }
      }
    }
  }],
  'teacher': [{
    $lookup: {
      from: "users",
      localField: "teacher_id",
      foreignField: "_id",
      as: "teacherRef"
    }
  }, {
    $addFields: {
      "teacher": {
        _id: { $arrayElemAt: ["$teacherRef._id", 0] },
        fullname: { $arrayElemAt: ["$teacherRef.fullname", 0] },
        username: { $arrayElemAt: ["$teacherRef.username", 0] }
      }
    }
  }]
}

/**
 * Returns the mongo query objects to add to the pipeline in order to populate what you want on the project
 * @param {string[]} props all of the properties you want populated, writen out in a string array
 */
const populateProperties = function (props) {
  let populationPipeline = []

  if (!props || !(props instanceof Array)) {
    return populationPipeline
  }

  for (let prop of props) {
    // if it's in the populatable property object, add it to the pipeline
    if (populationProperties[prop]) {
      populationPipeline = populationPipeline.concat(populationProperties[prop])
    }
  }
  return populationPipeline
}

module.exports = {
  populateProperties
}