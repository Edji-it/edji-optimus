// library imports
import 'mocha'
import { expect } from 'chai'
import { assert, stub, SinonStub } from 'sinon'

// project imports
import { validateSearchQuery, constructSearch } from './_search'
import elastic from './../../../elasticsearch'

describe('reading search helpers', () => {
  const queriableStringProperties = [
    'html',
    'title',
    'parent_id',
    'owner_id',
    'source',
    'version_id',
  ]
  const queriableBooleanProperties = [
    'owner_bookmarked',
    // 'public'
  ]
  describe('validateSearchQuery', () => {
    it('should set proper defaults', () => {
      const { error, value: query } = validateSearchQuery({})
      expect(error).to.not.exist
      expect(query).to.have.property('start')
      expect(query.start).to.be.equal(0)
      expect(query).to.have.property('size')
      expect(query.size).to.be.equal(15)
    })
    queriableStringProperties.forEach((prop) => {
      it(`should allow a query for ${prop}`, () => {
        const requestQuery = { [prop]: 'someString' }
        const { error, value: query } = validateSearchQuery(requestQuery)
        expect(error).to.not.exist
        expect(query).to.have.property(prop)
        expect(query[prop]).to.be.equal(requestQuery[prop])
      })
    })
    queriableBooleanProperties.forEach((prop) => {
      it(`should allow a query for ${prop}`, () => {
        // assign it as a string here and test it against a boolean later to ensure it converts properly
        const requestQuery = { [prop]: 'false' }
        const { error, value: query } = validateSearchQuery(requestQuery)
        expect(error).to.not.exist
        expect(query).to.have.property(prop)
        expect(query[prop]).to.be.equal(false)
      })
    })
    it('should accept lte and gte values for grade_levels', () => {
      const requestQuery = { grade_levels_gte: 5, grade_levels_lte: 8 }
      const { error, value: query } = validateSearchQuery(requestQuery)
      expect(error).to.not.exist
      expect(query).to.have.property('grade_levels_gte')
      expect(query).to.have.property('grade_levels_lte')
      expect(query.grade_levels_gte).to.be.equal(requestQuery.grade_levels_gte)
      expect(query.grade_levels_lte).to.be.equal(requestQuery.grade_levels_lte)
    })
    it('should accept an array of subjects', () => {
      const requestQuery = { subjects: ['math', 'science', 'english'] }
      const { error, value: query } = validateSearchQuery(requestQuery)
      expect(error).to.not.exist
    })
    it('should accept a single subject', () => {
      const requestQuery: any = { subjects: 'math' } // type as any because typescript won't let us do it otherwise
      const { error, value: query } = validateSearchQuery(requestQuery)
      expect(error).to.not.exist
    })
    it('should throw an error for unexpected query properties', () => {
      const requestQuery: any = { q: 'somestring' } // type as any because typescript won't let us do it otherwise
      const { error, value: query } = validateSearchQuery(requestQuery)
      expect(error).to.exist
    })
  })
  describe('constructSearch', () => {
    let elasticStub: SinonStub
    beforeEach(() => {
      elasticStub = stub(elastic, 'search')
    })
    afterEach(() => {
      elasticStub.restore()
    })
    it('should call search with correct default parameters', async () => {
      await constructSearch({})
      assert.calledOnce(elasticStub)
      let { index, type, body } = elasticStub.firstCall.args[0]
      expect(index).to.be.equal('readings')
      expect(type).to.be.equal('default')
      expect(body).to.be.instanceOf(Object)
      expect(body).to.have.property('query')
      expect(body.query).to.have.property('bool')
      expect(body.query.bool).to.have.property('must')
      expect(body.query.bool.must).to.be.instanceOf(Array)
      expect(body.query.bool.must).to.be.lengthOf(1)
      let publicCondition = body.query.bool.must[0]
      expect(publicCondition).to.have.property('match')
      expect(publicCondition.match).to.have.property('public')
      expect(publicCondition.match.public).to.be.true
    })
    for (let i = 0; i < queriableStringProperties.length; i++) {
      let field = queriableStringProperties[i]
      it(`should construct a query for ${field}`, async () => {
        const testValue = 'edji is the greatest tool'
        await constructSearch({ [field]: testValue })
        assert.calledOnce(elasticStub)
        const fieldRequirement = elasticStub.firstCall.args[0].body.query.bool.must.find(req => !!req.match.hasOwnProperty(field))
        expect(fieldRequirement, `did not find requirement in must query for ${field}`).to.exist
        expect(fieldRequirement).to.have.property('match')
        expect(fieldRequirement.match[field]).to.be.equal(testValue)
      })
    }
    for (let i = 0; i < queriableBooleanProperties.length; i++) {
      let field = queriableBooleanProperties[i]
      it(`should construct a query for ${field}`, async () => {
        const testValue = false
        await constructSearch({ [field]: testValue })
        assert.calledOnce(elasticStub)
        const fieldRequirement = elasticStub.firstCall.args[0].body.query.bool.must.find(req => !!req.match.hasOwnProperty(field))
        expect(fieldRequirement, `did not find requirement in must query for ${field}`).to.exist
        expect(fieldRequirement).to.have.property('match')
        expect(fieldRequirement.match[field]).to.be.equal(testValue)
      })
    }
    it('should construct a query for multiple subjects', async () => {
      const query = { subjects: ['reading', 'math', 'science'] }
      await constructSearch(query)
      const subjectsQuery = elasticStub.firstCall.args[0].body.query.bool.must.find(req => !!req.match.subjects)
      expect(subjectsQuery).to.exist
      expect(subjectsQuery.match.subjects).to.be.equal(query.subjects.join(' '))
    })
    it('should construct a query for grade_levels', async () => {
      const query = { grade_levels_gte: 4, grade_levels_lte: 8 }
      await constructSearch(query)
      const condition = elasticStub.firstCall.args[0].body.query.bool.must.find(req => !!req.range && !!req.range.grade_levels)
      const { lte, gte } = condition.range.grade_levels
      expect(lte).to.be.equal(query.grade_levels_lte)
      expect(gte).to.be.equal(query.grade_levels_gte)
    })
  })
})