'use strict';

/* eslint-disable indent */
const concat  = require('concat-stream'),
      parse   = JSON.parse;
/* eslint-enable indent */

/**
 * @ngdoc function
 * @name oboeStreamRequest
 *
 * @description
 * Wrapper for using oboe.js & request.js together by providing
 * a similar interface as the bundled HTTP client. This should
 * permit more options to be set as part of the request eg: PROXY
 *
 * @param {function}    oboe      oboe.js module
 * @param {function}    request   request.js module
 *
 * @example
 *
 *      const request = require('request'),
 *            oboe    = require('request'),
 *            fetch   = require('oboe-stream-request')(oboe, request);
 *
 *      fetch({
 *          url : 'http://myhost.com/json.json'
 *          .... other request.js options
 *      })
 *      .on('start',   () => { ... })
 *      .on('fail',    () => { ... })
 *      .on('aborted', () => { ... })
 *      .on('done',    () => { ... })
 */

function oboeStreamRequest (oboe, request) {

    if (arguments.length < 2) {
        throw new Error('oboe-stream-request, expects 2 arguments');
    }

    const OBOE_ABORTED_EVENT = 7;

    return (requestOptions) => {

        let req        = request(requestOptions),
            oboeStream = oboe(),
            handlers   = oboeStreamRequest.setup(req, oboeStream);

        req
            .on('response', handlers.onResponse)
            .on('error', handlers.onError);

        // oboe will emit this event internally when an abort is received, but
        // its not really publically documented, and has a non-intuitive name

        oboeStream.on(OBOE_ABORTED_EVENT, handlers.onAborted);

        return oboeStream;
    };
}

/**
 * @ngdoc function
 * @name setup
 *
 * @description
 * Handles the incoming response before the request body has
 * been fully received and emits the correct oboe events for
 * start, data & end.
 *
 * @param {object}  res             readable stream
 * @param {object}  oboeStream      an oboe stream
 *
 */

oboeStreamRequest.setup = (req, oboeStream) => {

    let self    = oboeStreamRequest,
        aborted = false;

    return {

        /**
         * @ngdoc function
         * @name onResponse
         *
         * @description
         * Handles the incoming response before the request body has
         * been fully received and emits the correct oboe events for
         * start, data & end.
         *
         * Based upon behavior seen here :
         * https://github.com/jimhigson/oboe.js/blob/master/src/streamingHttp.node.js#L91
         *
         * @param {object}  res     readable stream
         *
         */

        onResponse : (res) => {

            let statusCode = res.statusCode,
                successful = String(statusCode)[0] === '2';

            // a non-native oboe stream will not emit a start
            // event - since this is still a HTTP request send
            // one to maintain parity

            oboeStream.emit('start', statusCode, res.headers);

            if (!successful) {

                return req.pipe(concat((errorBody) => {

                    oboeStream.emit(
                        'fail', self.errorReport(statusCode, errorBody.toString())
                    );
                }));
            }

            req.on('data', (chunk) => {

                if (!aborted) { oboeStream.emit('data', chunk.toString()); }
            });

            req.on('end', () => {

                if (!aborted) { oboeStream.emit('end'); }
            });
        },

        /**
         * @ngdoc function
         * @name onError
         *
         * @description
         * Generic handler for emitting errors via oboe
         *
         * @param {object}  error     an error instance
         *
         */

        onError : (error) => {

            oboeStream.emit(
                'fail', self.errorReport(undefined, undefined, error)
            );
        },

        /**
         * @ngdoc function
         * @name onAborted
         *
         * @description
         * Upon receiving an abort event ensure that we end the request,
         * and flag it has being aborted.
         *
         * As oboe does not send a public "aborted" event, emit one
         */

        onAborted : () => {

            aborted = true;
            req.abort();

            oboeStream.emit(
                'aborted', self.errorReport(
                    undefined, undefined, new Error('HTTP request aborted')
                )
            );
        }
    };
};

/**
 * @ngdoc function
 * @name errorReport
 *
 * @description
 * Lifted directly from oboe to maintain a consistent error
 * response
 *
 * @param {number}  statusCode      incoming HTTP status code
 * @param {string}  body            response body
 * @param {object}  error           an error instance
 *
 */

oboeStreamRequest.errorReport = (statusCode, body, error) => {

    let jsonBody;

    try {
        jsonBody = parse(body);
    } catch (e) {}

    return {
        statusCode : statusCode,
        body       : body,
        jsonBody   : jsonBody,
        thrown     : error
    };
};

module.exports = oboeStreamRequest;
