# Edji Test Specs: Delete Comment

## Goal

Allow a user to delete their own comment

## Endpoint

`/:project_id/comments/:comment_id`

## Request Type

`DELETE`

## Test Cases

1.  Pass with `Authorization` header and student token
    *  `res` should have `status` = `204`
2.  Pass with `Authorization` header and invalid project id --> receive `400`
    *  `res` should have an `errors`
    *  `res.errors` should have a:
        *  `badRequest`: `any` should have a:
            *  `projectId`: `string` = `invalid`
3.  Pass with `Authorization` header and invalid comment id --> receive `400`
    *  `res` should have an `errors`
    *  `res.errors` should have a:
        *  `badRequest`: `any` should have a:
            *  `commentId`: `string` = `invalid`
4.  Pass with `Authorization` token for user who did not make comment --> receive `404` (have to do `204` right now - don't know how to test)
5.  Pass with `Authorization` and non-existant project id --> receive `404`
6.  Pass with `Authorization` and non-existant comment id --> receive `404` (also cannot test right now because database returns project w/ comment already deleted)
7.  Pass without `Authorization` header --> receive `401`