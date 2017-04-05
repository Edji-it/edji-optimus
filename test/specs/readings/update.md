# Edji Test Specs: Update Reading

## Goal

Update one or more of a select list of properties on a reading

## Endpoint

`/readings/:id`

## Request Type

`PUT`

## Request Data

The request body should contain a `reading` with any one of the following options in json form

```javascript
reading: {
  html: string,
  words: string,
  title: string,
  public: boolean,
  source: string,
  cover_img: string,
  tags: Tag[],
  draft: boolean
}
```

## Response Data

`200` status if the call is successful, and the `reading` is in the body

## Test Cases

1.  Pass with good id and 'good' values for all accepted values (outlined above) --> return `200` with reading object
    *  For each property in the update, the returned reading should have an equal property
2.  Pass without `reading` in body --> receive `400`
3.  Pass with id which is not an id --> receive `400`
4.  Pass with non-existant id --> receive `404`
5.  Pass with fields that are not outlined above --> receive `400` with `{ validationErrors: { invalidProperties: string[] }}` where `invalidProperties` contains all of the invalid properties
6.  Pass with `Authorization` token which is not the owner's --> receive `404`
7.  Pass without `Authorization` header --> receive `401`