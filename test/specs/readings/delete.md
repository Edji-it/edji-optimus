# Edji Test Specs: Delete Reading

## Goal

Allow a teacher to delete a project and all of the associated readings

## Endpoint

`/readings/:id`

## Request Type

`DELETE`

## Returns
`200` upon success

## Test Cases

1.  Pass with `Authorization` header and student token
    *  `res` should have `status` = `204`
2.  Pass with `Authorization` header and invalid project id --> receive `400`
3.  Pass with `Authorization` and non-existant project id --> receive `404`
4.  Pass with `Authorization` header that has student token --> receive `404`
5.  Pass without `Authorization` header --> receive `401`