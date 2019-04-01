// library imports
import 'mocha'
import { expect } from 'chai'
import { assert, stub, SinonStub, mock, SinonMock } from 'sinon'
import { ObjectId } from 'mongodb'
require('sinon-mongoose')

// project imports
import { validateSearchQuery, constructSearch, searchByIds } from './_search'
import elastic from '../../../services/elasticsearch'
import * as Reading from './../../../models/Reading'

describe('reading search helpers', () => {
  const queriableStringProperties = ['html', 'title', 'parent_id', 'owner_id', 'source', 'version_id', 'subjects']
  const queriableBooleanProperties = [
    'owner_bookmarked',
    // 'public'
  ]
  describe('validateSearchQuery', () => {
    it('should set proper defaults', () => {
      const { error, value: query } = validateSearchQuery({})
      expect(error).to.not.exist
      expect(query).to.have.property('from')
      expect(query.from).to.be.equal(0)
      expect(query).to.have.property('size')
      expect(query.size).to.be.equal(15)
    })
    queriableStringProperties.forEach(prop => {
      it(`should allow a query for ${prop}`, () => {
        const requestQuery = { [prop]: 'someString' }
        const { error, value: query } = validateSearchQuery(requestQuery)
        expect(error).to.not.exist
        expect(query).to.have.property(prop)
        expect(query[prop]).to.be.equal(requestQuery[prop])
      })
    })
    queriableBooleanProperties.forEach(prop => {
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
    it('should accept a single subject', () => {
      const requestQuery: any = { subjects: 'math' } // type as any because typescript won't let us do it otherwise
      const { error, value: query } = validateSearchQuery(requestQuery)
      expect(error).to.not.exist
    })
    it('should throw an error for unexpected query properties', () => {
      const requestQuery: any = { notvalid: 'somestring' } // type as any because typescript won't let us do it otherwise
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
      expect(body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  public: true,
                },
              },
            ],
            must_not: [
              {
                match: {
                  draft: true,
                },
              },
              {
                exists: {
                  field: 'parent_id',
                },
              },
            ],
            must: [
              {
                bool: {
                  must: [],
                  should: [],
                },
              },
            ],
          },
        },
      })
    })
    for (let i = 0; i < queriableStringProperties.length; i++) {
      let field = queriableStringProperties[i]
      it(`should construct a query for ${field}`, async () => {
        const testValue = 'edji is the greatest tool'
        await constructSearch({ [field]: testValue })
        assert.calledOnce(elasticStub)
        expect(elasticStub.firstCall.args[0].body).to.eql({
          query: {
            bool: {
              filter: [
                {
                  match: {
                    public: true,
                  },
                },
              ],
              must_not: [
                {
                  match: {
                    draft: true,
                  },
                },
                {
                  exists: {
                    field: 'parent_id',
                  },
                },
              ],
              must: [
                {
                  bool: {
                    must: [],
                    should: [],
                  },
                },
                {
                  match: {
                    [field]: testValue,
                  },
                },
              ],
            },
          },
        })
      })
    }
    for (let i = 0; i < queriableBooleanProperties.length; i++) {
      let field = queriableBooleanProperties[i]
      it(`should construct a query for ${field}`, async () => {
        const testValue = false
        await constructSearch({ [field]: testValue })
        assert.calledOnce(elasticStub)
        expect(elasticStub.firstCall.args[0].body).to.eql({
          query: {
            bool: {
              filter: [
                {
                  match: {
                    public: true,
                  },
                },
                {
                  match: {
                    [field]: testValue,
                  },
                },
              ],
              must_not: [
                {
                  match: {
                    draft: true,
                  },
                },
                {
                  exists: {
                    field: 'parent_id',
                  },
                },
              ],
              must: [
                {
                  bool: {
                    must: [],
                    should: [],
                  },
                },
              ],
            },
          },
        })
      })
    }
    it('should construct a query for multiple subjects', async () => {
      const query = { subjects: 'reading math science' }
      await constructSearch(query)
      expect(elasticStub.firstCall.args[0].body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  public: true,
                },
              },
            ],
            must_not: [
              {
                match: {
                  draft: true,
                },
              },
              {
                exists: {
                  field: 'parent_id',
                },
              },
            ],
            must: [
              {
                bool: {
                  must: [],
                  should: [],
                },
              },
              {
                match: {
                  subjects: 'reading math science',
                },
              },
            ],
          },
        },
      })
    })
    it('should construct a query for grade_levels', async () => {
      const query = { grade_levels_gte: 4, grade_levels_lte: 8 }
      await constructSearch(query)
      expect(elasticStub.firstCall.args[0].body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  public: true,
                },
              },
              {
                range: {
                  grade_levels: {
                    lte: query.grade_levels_lte,
                    gte: query.grade_levels_gte,
                  },
                },
              },
            ],
            must_not: [
              {
                match: {
                  draft: true,
                },
              },
              {
                exists: {
                  field: 'parent_id',
                },
              },
            ],
            must: [
              {
                bool: {
                  must: [],
                  should: [],
                },
              },
            ],
          },
        },
      })
    })
    it('should sort by a field', async () => {
      const query = { sort: 'createdAt' }
      await constructSearch(query)
      expect(elasticStub.firstCall.args[0].body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  public: true,
                },
              },
            ],
            must_not: [
              {
                match: {
                  draft: true,
                },
              },
              {
                exists: {
                  field: 'parent_id',
                },
              },
            ],
            must: [
              {
                bool: {
                  must: [],
                  should: [],
                },
              },
            ],
          },
        },
        sort: [
          {
            createdAt: 'asc',
          },
        ],
      })
    })
    it('should change the sort order', async () => {
      const query = { sort: 'createdAt', sort_order: 'desc' }
      await constructSearch(query)
      expect(elasticStub.firstCall.args[0].body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  public: true,
                },
              },
            ],
            must_not: [
              {
                match: {
                  draft: true,
                },
              },
              {
                exists: {
                  field: 'parent_id',
                },
              },
            ],
            must: [
              {
                bool: {
                  must: [],
                  should: [],
                },
              },
            ],
          },
        },
        sort: [
          {
            createdAt: 'desc',
          },
        ],
      })
    })
  })
  describe('searchByIds', () => {
    let ReadingMock: SinonMock
    beforeEach(() => {
      ReadingMock = mock(Reading)
    })
    afterEach(() => {
      ReadingMock.restore()
    })
    it('should return reading results in requested order', async () => {
      // ids to get from mongodb in the order we want them returned
      const ids: string[] = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()]
      // ids returned from mongo in a different order which must be sorted before returning
      const readingReturn = [
        { _id: new ObjectId(ids[1]) },
        { _id: new ObjectId(ids[2]) },
        { _id: new ObjectId(ids[0]) },
      ]
      // set up the return for the mock
      ReadingMock.expects('aggregate')
        .exactly(1)
        .resolves(readingReturn)
      const res = await searchByIds(ids)
      // verify length and order or return
      expect(res.length).to.be.equal(3)
      expect(res[0]._id.equals(ids[0])).to.be.true
      expect(res[1]._id.equals(ids[1])).to.be.true
      expect(res[2]._id.equals(ids[2])).to.be.true
    })
  })
})
