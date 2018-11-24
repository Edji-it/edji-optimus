# Edji Test Specs: Update Comment

## Goal

Update one or more of a select list of properties on a comment

## Endpoint

`/projects/:project_id/comments/:comment_id`

## Request Type

`PUT`

## Request Data

The request body should contain a `reading` with any one of the following options in json form

```javascript
comment: {
  start: number,
  end: number,
  data: string,
  dataArray: any[],
  url: string,
  author: string,
  text: string,
  loc: {
    x: number,
    y: number
  }
}
```

## Response Data

`200` status if the call is successful, and the updated `comment` is in the body

## Test Cases

1.  Pass with good id's and 'good' values for all accepted values (outlined above) --> return `200` with updated comment
    *  For each property in the update, the returned comment should have an equal property
2.  Pass without `comment` in body --> receive `400`
3.  Pass with project_id which is not an id --> receive `400`
4.  Pass with comment_id which is not an id --> receive `400`
5.  Pass with non-existant project_id --> receive `404`
6.  Pass with non-existant comment_id --> receive `404`
7.  Pass with `Authorization` token which does not correspond to the comment --> receive `404`
8.  Pass without `Authorization` header --> receive `401`