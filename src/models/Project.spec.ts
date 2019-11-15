import { expect } from 'chai'
import { ObjectId } from 'mongodb'

const Project = require('./Project').default

describe('Project model', () => {
  it('should fail to create a project', () => {
    const p = new Project({})
    const errors = p.validateSync()
    expect(errors).to.exist
  })
  it('should create a valid project with minimum requirements', () => {
    const defaults = {
      label: 'a name',
      code: '1234',
      teacher_id: new ObjectId(),
      reading_id: new ObjectId(),
    }
    const p = new Project(defaults)
    expect(p.validateSync()).not.to.exist
    expect(p).to.have.property('label', defaults.label)
    expect(p).to.have.property('code', defaults.code)
    expect(p)
      .to.have.property('temp_ids')
      .instanceOf(Array)
      .lengthOf(0)
    expect(p)
      .to.have.property('students_ids')
      .instanceOf(Array)
      .lengthOf(0)
  })
})
