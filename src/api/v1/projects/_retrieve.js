// project imports
const User = require('./../../../models/User')
const Project = require('./../../../models/Project')
const pipolog = require('./../../../pipolog').pipoLog

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
        parent_id: { $arrayElemAt: ["$reading.parent_id", 0] },
        createdAt: { $arrayElemAt: ["$reading.createdAt", 0] }
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
        username: { $arrayElemAt: ["$teacherRef.username", 0] },
        archive_readings_before: { $arrayElemAt: ["$teacherRef.archive_readings_before", 0] },
        hero_status: { $arrayElemAt: ["$teacherRef.hero_status", 0] }
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

/**
 * Add a user to the relevant array of students in the project, if they don't already exist
 * @param {User} user the user object from the request
 * @param {Project} project the project from the database
 */
const addIdToProject = async function (user, project) {
  // can't function without a project...
  if (!project) {
    throw new Error(`no project sent to addIdToProject - user: ${user && user._id}, project: ${project && project._id}`)
  }
  console.log('checking the project')

  // obvi, we don't want to add the teacher to the students array if they're the teacher
  //  there is also sometimes not a user when this endpoint is called, like when someone doesn't yet have an account
  if (!user || user._id.equals(project.teacher_id)) {
    console.log('no user here', !user, user._id.equals(project.teacher_id))
    return { project }
  }
  console.log('check 1')

  let id = user._id
  let update
  // add temp users to the temp_ids array
  if (user.type && user.type === 'temp') {
    console.log('check 4')
    if (!project.temp_ids.includes(id)) {
      update = {
        $push: {
          temp_ids: id
        }
      }
      project.temp_ids.push(user._id)
    }
    // add logged in users to the students_ids array
  } else if (!project.students_ids.includes(id)) {
    console.log('check 2')
    update = {
      $push: {
        students_ids: id
      }
    }
    project.students_ids.push(user._id)
  } else {
    console.log('check 3')
    return { project }
  }

  return { project, update }
}

/**
 * logs that a student joined a reading as an event to pipo
 * @param {User} user the user object from the request
 * @param {Project} project the project from the database
 */
const logJoinToPipo = function (user, project) {
  return pipolog({
    user_id: user._id,
    teacher: user._id.equals(project.teacher_id),
    hero: !!user.hero_status,
    event_name: 'reading_joined'
  })
}

const decorateProject = function (project) {
  // here we're going to do a little curation for the returned project to make sure the comments come back with a replies array
  var repliesObj = []
  let size = project.comments.length
  for (let i = 0; i < size; i++) {
    let comment = project.comments[i]
    if (comment.reply_to) {
      if (!repliesObj[comment.reply_to]) {
        repliesObj[comment.reply_to] = []
      }

      repliesObj[comment.reply_to].push(comment._id)
    }
  }

  // assign the array of reply _id's to the applicable comment
  for (let reply_to_id in repliesObj) {
    let comment = project.comments.find((comment) => {
      return comment._id == reply_to_id
    })
    if (comment) {
      comment.replies = repliesObj[reply_to_id]
    }
  }

  return project
}

module.exports = {
  populateProperties,
  addIdToProject,
  logJoinToPipo,
  decorateProject
}