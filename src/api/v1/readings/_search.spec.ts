// library imports
import 'mocha'
import { expect } from 'chai'

// project imports
import { validateSearchQuery, ReadingQuery } from './_search'

describe('reading search helpers', () => {
  describe('validateSearchQuery', () => {
    it('should set proper defaults', () => {
      const { error, value: query } = validateSearchQuery({})
      expect(error).to.not.exist
      expect(query).to.have.property('start')
      expect(query.start).to.be.equal(0)
      expect(query).to.have.property('size')
      expect(query.size).to.be.equal(15)
    })
    const queriableStringProperties = [
      'html',
      'title',
      'parent_id',
      'owner_id',
      'source',
      'version_id',
    ].forEach((prop) => {
      it(`should allow a query for ${prop}`, () => {
        const requestQuery = { [prop]: 'someString' }
        const { error, value: query } = validateSearchQuery(requestQuery)
        expect(error).to.not.exist
        expect(query).to.have.property(prop)
        expect(query[prop]).to.be.equal(requestQuery[prop])
      })
    })
    const queriableBooleanProperties = [
      'owner_bookmarked',
      'public'
    ].forEach((prop) => {
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
})