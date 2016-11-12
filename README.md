# oboe-stream-request

`oboe-stream-request` provides support for using [request.js](https://github.com/request/request) with [Oboe.js](https://github.com/jimhigson/oboe.js/)

## installation

```
> yarn add oboe-stream-request or
> npm i oboe-stream-request --save
```

## usage

```javascript
const request = require('request'),
      oboe    = require('request'),
      fetch   = require('oboe-stream-request')(oboe, request);

fetch({
    url : 'http://myhost.com/json.json'
    .... other request.js options
})
.on('start',   () => { ... })
.on('fail',    () => { ... })
.on('aborted', () => { ... })
.on('done',    () => { ... })
```
> example usage

### additions

A `aborted` event can be subscribed to listen to when an oboe abort event is fired.

# Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using yarn test / npm test.

# Release History

- *1.0.0* Initial release

# License

Copyright (c) 2016 Jonathan Barnett. Licensed under the MIT license.
