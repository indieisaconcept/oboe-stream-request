import test from 'ava';
import oboeStreamRequest from '../';
import { EventEmitter } from 'events';

const setup = oboeStreamRequest.setup;

test('is a function', (t) => {

    let onError = setup({}, {}).onError;

    t.is(typeof onError, 'function');
    t.is(onError.length, 1, 'has an arity of 1');
});

test.cb('emits a "fail" event when called', (t) => {

    let emitter = new EventEmitter(),
        onError = setup({}, emitter).onError,
        error   = new Error('I am an error');

    emitter.on('fail', (context) => {

        t.is(typeof context, 'object');
        t.deepEqual(Object.keys(context), ['statusCode', 'body', 'jsonBody', 'thrown']);
        t.deepEqual(context.thrown, error);
        t.end();
    });

    onError(error);
});
