# Edji Test Specs: Create a new comment

## Goal

Users can add a comment to a project

## Endpoint

`/projects/:id/comments`

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  comment: {
    user_id: string,
    author: string,
    start: number,
    end: number,
    type: string,
    text: string,
    data?: string
  }
}
```

## Response Data

Coming soon?

## Test Cases

1.  Pass good emoji comment
    *  `res` should have a:
        *  `status` = `201`
        *  `comment`: `any`
    *  `res.comment` should have a:
        *  `_id`: `string`
        *  `user_id`: `string`
        *  `author`: `string`
        *  `start`: `number`
        *  `end`: `number`
        *  `type`: `string` = `emoji`
        *  `data`: `string`
        *  `text`: `string`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
2.  Pass good text comment
    *  `res` should have a:
        *  `status` = `201`
        *  `comment`: `any`
    *  `res.comment` should have a:
        *  `_id`: `string`
        *  `user_id`: `string`
        *  `author`: `string`
        *  `start`: `number`
        *  `end`: `number`
        *  `type`: `string` = `text`
        *  `data`: `string`
        *  `text`: `string`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
3.  Pass an empty text comment (no `data` field)
    *  `res` should have a:
        *  `status` = `201`
        *  `comment`: `any`
    *  `res.comment` should have a:
        *  `_id`: `string`
        *  `user_id`: `string`
        *  `author`: `string`
        *  `start`: `number`
        *  `end`: `number`
        *  `type`: `string`
        *  `text`: `string`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
4.  Pass text comment without required fields (this test will also validate emoji comment)
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `validationErrors`: `any` should have a:
                *  `user_id`: `string` = `required`
                *  `start`: `string` = `required`
                *  `end`: `string` = `required`
5.  Pass with invalid project id --> receive `400`
6.  Pass without comment --> receive `400`
7.  Pass with non-existing project id --> receive `404`
8.  Pass without `Authorization` header --> receive `401`