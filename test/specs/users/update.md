# Edji Test Specs: Update User

## Goal

Update one or more of a select list of properties on a reading

## Endpoint

`/users/:id`

## Request Type

`PUT`

## Request Data

The request body should contain a `reading` with any one of the following options in json form

```javascript
user: {
  username: string,
  fullname: string,
  email: string,
  identities: string[],
  prefs: { recentEmoji: string[] },
  media: {
    images: { title: string, url: string }[],
    documents: { title: string, pages: string[] }[]
  }
}
```

## Response Data

`200` status if the call is successful, and the `user` is returned in the body

## Test Cases

1.  Pass with good id and 'good' values for all accepted values (outlined above) --> return `200` with user object
    *  For each property in the update, the returned user should have an equal property
2.  Pass without `user` in body --> receive `400`
3.  Pass with id which is not an id --> receive `400`
4.  Pass with non-existant id --> receive `404`
5.  Pass with fields that are not outlined above --> receive `400` with `{ validationErrors: { invalidProperties: string[] }}` where `invalidProperties` contains all of the invalid properties
6.  Pass with `Authorization` token which is not the owner's --> receive `401`
7.  Pass without `Authorization` header --> receive `401`