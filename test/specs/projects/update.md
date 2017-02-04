# Edji Test Specs: Create Project

## Goal

Update a single property on a project

## Endpoint

`/projects/:id`

## Request Type

`PUT`

## Request Data

The request takes url encoded query parameters, which can consist of:

```javascript
heat_vision: boolean
```

## Response Data

`204` status if the call is successful

## Test Cases

1.  Pass with good id and `heat_vision` true --> return `204`
2.  Pass without any parameters --> receive `400`
3.  Pass with id which is not an id --> receive `400`
4.  Pass with non-existant id --> receive `404`
5.  Pass with fields that don't exist --> ???
6.  Pass with `Authorization` token which is not the owner's --> receive `401`
7.  Pass without `Authorization` header --> receive `401`