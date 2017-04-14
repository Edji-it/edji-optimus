# Edji Test Specs: Create Reading

## Goal

Users can store a reading

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  reading: {
    title: string,
    html: string,
    source: string,
    words: any[]
  }
}
```

NOTE: If you are trying to make a new version of an existing reading, and it should be V2 of a user's reading, the call MUST have the `owner_id` in order to know which version to attribute the new reading to. Otherwise, it will automatically open up a new version list.

## Response Data

Coming soon?

## Test Cases

1.  Pass good object without `version_id`
    *  `res` should have a:
        *  `status` = `201`
        *  `reading`: `any`
    *  `res.reading` should have a:
        *  `_id`: `string`
    *  `res.reading` should NOT have a:
        *  `owner_id`: `string`
        *  `version_id`: `ObjectId`
        *  `title`: `string`
        *  `words`: `any[]`
        *  `html`: `string`
        *  `promoter_ids`: `string[]`
        *  `comments`: `Comment[]`
        *  `teacher_ids`: `string[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
2.  Pass good object with `version_id`
    *  `res` should have a:
        *  `status` = `201`
        *  `reading`: `any`
    *  `res.reading` should have a:
        *  `_id`: `string`
    *  `res.reading` should NOT have a:
        *  `owner_id`: `string`
        *  `version_id`: `ObjectId`
        *  `title`: `string`
        *  `words`: `any[]`
        *  `html`: `string`
        *  `promoter_ids`: `string[]`
        *  `comments`: `Comment[]`
        *  `teacher_ids`: `string[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
3.  Pass without reading --> receive `400`
4.  Pass without required fields
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `validationErrors`: `any` should have a:
                *  `html`: `boolean` = `true`
                *  `words`: `boolean` = `true`
                *  `title`: `boolean` = `true`
                *  `owner_id`: `boolean` = `true`
5.  Pass without `Authorization` header --> receive `401`