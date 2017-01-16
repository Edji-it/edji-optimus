# Edji Test Specs: Login

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

## Response Data

Coming soon?

## Test Cases

1.  Pass good object
    *  `res` should have a:
        *  `status` = `201`
        *  `reading`: `any`
    *  `res.reading` should have a:
        *  `_id`: `string`
        *  `owner_id`: `string`
        *  `title`: `string`
        *  `words`: `any[]`
        *  `html`: `string`
        *  `promoter_ids`: `string[]`
        *  `comments`: `Comment[]`
        *  `teacher_ids`: `string[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
2.  Pass without reading --> receive `400`
3.  Pass without required fields
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `validationErrors`: `any` should have a:
                *  `html`: `boolean` = `true`
                *  `words`: `boolean` = `true`
                *  `title`: `boolean` = `true`
                *  `owner_id`: `boolean` = `true`
4.  Pass without `Authorization` header --> receive `401`