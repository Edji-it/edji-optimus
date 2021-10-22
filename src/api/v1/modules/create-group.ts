import { NextFunction, Response } from 'express'
import { pick } from 'underscore'

import Module from '../../../models/Module'
import Project from '../../../models/Project'
import Reading from '../../../models/Reading'

export default async function createGroupHandler(req: any, res: Response, next: NextFunction) {
  // Creates a new group based on the current set of readings.
  const user = req.user
  const { module_id } = req.params

  const module = await Module.findOne({ _id: module_id, teacher_id: user._id })
  if (!module) {
    return res.status(404).send({ error: 'module not found' })
  }

  try {
    const groupData = <any>pick(req.body, ['label', 'student_ids', 'temp_ids'])
    groupData.project_ids = []

    // Create projects
    for (let i = 0; i < module.reading_ids.length; i++) {
      const reading = await Reading.findById(module.reading_ids[i])
      if (reading) {
        const project = new Project({
          teacher_id: module.teacher_id,
          co_owner_ids: module.co_owner_ids,
          reading_id: module.reading_ids[i],
          comments: [],
          answers: [],
          report_evals: [],
          feedback: [],
          student_ids: groupData.student_ids || [],
          temp_ids: groupData.temp_ids || [],
          label: groupData.label,
          tags: [],
          heat_vision: false,
          group_instructions: reading.default_instructions,
          quick_labels: [],
          outcomes: [],
        })
        await project.validate()
        await project.edjiSave()
        groupData.project_ids.push(project._id)
      }
    }

    module.groups.push(groupData)
    await module.validate()
    await module.edjiSave()
    return res.status(201).send(module)
  } catch (err) {
    console.log(err)
    return res.status(500).send({ error: err.message })
  }
}
