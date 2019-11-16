// library imports
import 'mocha'
import { expect } from 'chai'
import { assert, stub, SinonStub, mock, SinonMock } from 'sinon'
import { ObjectId } from 'mongodb'
require('sinon-mongoose')

// project imports
import { validateSearchQuery, constructSearch, searchByIds } from './_search'
import * as elastic from '../../../services/elasticsearch'
import Reading from './../../../models/Reading'

describe('reading search helpers', () => {
  const queriableStringProperties = ['html', 'title', 'parent_id', 'owner_id', 'source', 'version_id', 'subjects']
  const queriableBooleanProperties = ['owner_bookmarked']
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
                  reading_type: 'public',
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
        _source: '',
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
                    reading_type: 'public',
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
          _source: '',
        })
      })
    }
    it('should query for school and district id', async () => {
      await constructSearch({ district_id: '2622050', school_id: '262205005926' })
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
                  reading_type: 'public',
                },
              },
              {
                term: {
                  'owner.school.district_id': '2622050',
                },
              },
              {
                term: {
                  'owner.school.school_id': '262205005926',
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
        _source: '',
      })
    })
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
                    reading_type: 'public',
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
          _source: '',
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
                  reading_type: 'public',
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
        _source: '',
      })
    })
    it('should construct a query for grade_levels', async () => {
      // 0 as a grade level here is also meant as a test against truthy comparison
      const query = { grade_levels_gte: 0, grade_levels_lte: 8 }
      await constructSearch(query)
      expect(elasticStub.firstCall.args[0].body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  reading_type: 'public',
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
        _source: '',
      })
    })
    it('should filter if the grade levels lte and gte are equal', async () => {
      const query = { grade_levels_gte: 0, grade_levels_lte: 0 }
      await constructSearch(query)
      expect(elasticStub.firstCall.args[0].body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  reading_type: 'public',
                },
              },
              {
                match: {
                  grade_levels: query.grade_levels_gte,
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
        _source: '',
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
                  reading_type: 'public',
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
        _source: '',
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
                  reading_type: 'public',
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
        _source: '',
        sort: [
          {
            createdAt: 'desc',
          },
        ],
      })
    })
    it('should construct the correct query for retrieving the users readings', async () => {
      const ownerId: string = new ObjectId().toHexString()
      const query = <any>{ scope: 'owner' }
      await constructSearch(query, ownerId)
      assert.calledOnce(elasticStub)
      let { body } = elasticStub.firstCall.args[0]
      expect(body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  owner_id: ownerId,
                },
              },
            ],
            must_not: [
              {
                match: {
                  draft: true,
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
        _source: '',
      })
    })
    it('should construct the correct query for retrieving the public readings by scope', async () => {
      const ownerId: string = new ObjectId().toHexString()
      const query = <any>{ scope: 'public' }
      await constructSearch(query, ownerId)
      assert.calledOnce(elasticStub)
      let { body } = elasticStub.firstCall.args[0]
      expect(body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  reading_type: 'public',
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
        _source: '',
      })
    })
    it('should construct a query which include a single bucket', async () => {
      const query = <any>{ buckets: ['subject'], bucket_max: 10 }
      await constructSearch(query)
      assert.calledOnce(elasticStub)
      let { body } = elasticStub.firstCall.args[0]
      expect(body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  reading_type: 'public',
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
        _source: '',
        aggs: {
          subject: {
            terms: {
              field: 'subject.keyword',
              size: 10,
            },
          },
        },
      })
    })
    it('should construct a query with multiple buckets', async () => {
      const query = <any>{ buckets: ['subject', 'tags'], bucket_max: 10 }
      await constructSearch(query)
      assert.calledOnce(elasticStub)
      let { body } = elasticStub.firstCall.args[0]
      expect(body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  reading_type: 'public',
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
        _source: '',
        aggs: {
          subject: {
            terms: {
              field: 'subject.keyword',
              size: 10,
            },
          },
          tags: {
            terms: {
              field: 'tags.keyword',
              size: 10,
            },
          },
        },
      })
    })
    it('should allow specification of maximum returned bucket values', async () => {
      const query = <any>{ buckets: ['tags'], bucket_max: 20 }
      await constructSearch(query)
      assert.calledOnce(elasticStub)
      let { body } = elasticStub.firstCall.args[0]
      expect(body).to.eql({
        query: {
          bool: {
            filter: [
              {
                match: {
                  reading_type: 'public',
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
        _source: '',
        aggs: {
          tags: {
            terms: {
              field: 'tags.keyword',
              size: 20,
            },
          },
        },
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
