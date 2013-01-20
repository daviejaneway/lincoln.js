lincoln.js
==========

lincoln.js is an SQL to MongoDB transpiler, written purely in javascript.

Goals
-----
lincoln.js aims to ease database migrations from SQL based systems to MongoDB, allowing you to query, update and insert
your MongoDB data in a subset of the Structured Query Language.

Why?
----
MongoDB's query language is extremely powerful & felxible. However, if you come to MongoDB from an SQL background,
it can be tricky to grasp some of the NoSQL concepts, especially when trying to migrate from an SQL database.
lincoln.js aims to make SQL developers & maintainers feel more at home in the MongoDB environment, without
sacrificing any of the performance gains.

Installation
------------
lincoln.js is essentially a plugin for the Mongo client and, as such, requires that you have access to
the Mongo shell. The test suite also requires node.js, although it can easily be ported to run on other javascript
platforms.

First, clone (or download) lincoln.js:

```
$ git clone git://github.com/daviejaneway/lincoln.js.git
$ cd lincoln.js
```

Optionally run the test suite (you will need node.js for this step):

```
$ node tests/*.js
```

To load up lincoln.js, fire up a MongoDB shell:

```
$ mongod
$ mongo --shell lincoln.js
```
To invoke the transpiler call out to:

```javascript
// Assuming your SQL statement is well formed, the transpiler will hand you back a query function.
var query_func = lincoln.sql_to_mongo("select a, b from test where a = 1 and b = 'Hello, Mongo!';");

// Invoking the query function returns a mongo cursor (e.g db.test.find())
query_func();

> {_id: ObjectId(xyz), a:1, b:'Hello, World!'}
```

