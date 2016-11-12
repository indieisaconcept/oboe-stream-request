import test from 'ava';
import oboeStreamRequest from '../';
import { EventEmitter } from 'events';
import { createReadStream } from 'fs';
import pkg from '../package.json';

const setup = oboeStreamRequest.setup;

test('is a function', (t) => {

    let onResponse = setup({}, {}).onResponse;

    t.is(typeof onResponse, 'function');
    t.is(onResponse.length, 1, 'has an arity of 1');
});

test.cb('emits a "start" event when called', (t) => {

    let request    = new EventEmitter(),
        oboe       = new EventEmitter(),
        onResponse = setup(request, oboe).onResponse;

    oboe.on('start', (statusCode, headers) => {
        t.is(statusCode, 200);
        t.deepEqual(headers, { 'content-type' : 'application/json' });
        t.end();
    });

    onResponse({
        statusCode : 200,
        headers    : { 'content-type' : 'application/json' }
    });
});

test.cb('when status code not in 200 range calls req.pipe and emits fail on complete', (t) => {

    let request    = createReadStream('../package.json'),
        oboe       = new EventEmitter(),
        onResponse = setup(request, oboe).onResponse;

    oboe.on('fail', (context) => {

        t.is(typeof context, 'object');
        t.deepEqual(Object.keys(context), ['statusCode', 'body', 'jsonBody', 'thrown']);

        t.is(context.statusCode, 404);
        t.deepEqual(JSON.parse(context.body), pkg);
        t.deepEqual(context.jsonBody, pkg);

        t.end();
    });

    onResponse({
        statusCode : 404,
        headers    : { 'content-type' : 'application/json' }
    });
});

test.cb('emits oboe "data" event on request data if not aborted', (t) => {

    let request    = new EventEmitter(),
        oboe       = new EventEmitter(),
        onResponse = setup(request, oboe).onResponse;

    oboe.on('data', (chunk) => {
        t.is(chunk, 'my chunk');
        t.end();
    });

    onResponse({
        statusCode : 200,
        headers    : { 'content-type' : 'application/json' }
    });

    request.emit('data', new Buffer('my chunk'));
});

test.cb('emits oboe "end" event on request end if not aborted', (t) => {

    let request    = new EventEmitter(),
        oboe       = new EventEmitter(),
        onResponse = setup(request, oboe).onResponse;

    oboe.on('end', (chunk) => { t.end(); });

    onResponse({
        statusCode : 200,
        headers    : { 'content-type' : 'application/json' }
    });

    request.emit('end');
});

test.cb('does not emit oboe data or end event if request aborted', (t) => {

    let request    = new EventEmitter(),
        oboe       = new EventEmitter(),
        handlers   = setup(request, oboe),
        onResponse = handlers.onResponse,
        onAborted  = handlers.onAborted;

    request.abort = () => {};

    oboe.on('data', () => { throw new Error('end should not be called'); });
    oboe.on('end', () => { throw new Error('data should not be called'); });

    onResponse({
        statusCode : 200,
        headers    : { 'content-type' : 'application/json' }
    });

    oboe.on('aborted', () => {
        request.emit('data');
        request.emit('end');
        t.end();
    });

    onAborted();
});
